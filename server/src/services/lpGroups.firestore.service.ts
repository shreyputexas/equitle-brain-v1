import { db, FirestoreHelpers } from '../lib/firebase';
import logger from '../utils/logger';

export interface LPGroup {
  id?: string;
  name: string;
  description?: string;
  type: string; // 'system' or 'custom'
  criteria?: Record<string, any>; // Store group criteria
  autoAssign: boolean;
  emailPreferences?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  // Calculated fields
  memberCount?: number;
  members?: InvestorGroupMember[];
}

export interface InvestorGroupMember {
  id?: string;
  investorId: string;
  groupId: string;
  assignedAt: Date;
  autoAssigned: boolean;
  // Populated investor data
  investor?: {
    id: string;
    name: string;
    type: string;
    totalCommitment?: number;
  };
}

export class LPGroupsFirestoreService {
  // Get all LP groups for a user
  static async getAllLPGroups(userId: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'lpGroups')
        .orderBy('type', 'asc') // System groups first
        .orderBy('createdAt', 'desc')
        .get();

      const groups = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const groupData = { id: doc.id, ...doc.data() };

          // Get members for this group
          const membersSnapshot = await FirestoreHelpers.getUserCollection(userId, 'investorGroupMembers')
            .where('groupId', '==', doc.id)
            .get();

          // Get investor details for each member and filter out orphaned memberships
          const members = await Promise.all(
            membersSnapshot.docs.map(async (memberDoc) => {
              const memberData = memberDoc.data();

              // Get investor details
              const investorDoc = await FirestoreHelpers.getUserDocInCollection(userId, 'investors', memberData.investorId).get();

              // Skip if investor doesn't exist (orphaned membership)
              if (!investorDoc.exists) {
                return null;
              }

              const investor = investorDoc.data();
              const investorData = {
                id: investorDoc.id,
                name: investor.name,
                type: investor.type,
                totalCommitment: investor.totalCommitment,
              };

              return {
                id: memberDoc.id,
                investorId: memberData.investorId,
                groupId: memberData.groupId,
                assignedAt: memberData.assignedAt,
                autoAssigned: memberData.autoAssigned,
                investor: investorData
              };
            })
          );

          // Filter out null values (orphaned memberships)
          const validMembers = members.filter(member => member !== null);

          return {
            ...groupData,
            members: validMembers,
            memberCount: validMembers.length
          };
        })
      );

      // Ensure existing investors are assigned to default group (migration logic)
      this.assignAllExistingInvestorsToDefaultGroup(userId).catch(err => {
        logger.error('Background assignment to default group failed:', err);
      });

      logger.info('Retrieved LP groups', { userId, count: groups.length });
      return { groups };
    } catch (error: any) {
      logger.error('Error getting LP groups:', error);
      throw new Error('Failed to retrieve LP groups');
    }
  }

  // Get single LP group by ID
  static async getLPGroupById(userId: string, groupId: string) {
    try {
      const groupDoc = await FirestoreHelpers.getUserDocInCollection(userId, 'lpGroups', groupId).get();

      if (!groupDoc.exists) {
        throw new Error('LP group not found');
      }

      const groupData = { id: groupDoc.id, ...groupDoc.data() };

      // Get members for this group
      const membersSnapshot = await FirestoreHelpers.getUserCollection(userId, 'investorGroupMembers')
        .where('groupId', '==', groupId)
        .get();

      const members = await Promise.all(
        membersSnapshot.docs.map(async (memberDoc) => {
          const memberData = memberDoc.data();

          // Get investor details
          const investorDoc = await FirestoreHelpers.getUserDocInCollection(userId, 'investors', memberData.investorId).get();

          let investorData = null;
          if (investorDoc.exists) {
            const investor = investorDoc.data();
            investorData = {
              id: investorDoc.id,
              name: investor.name,
              type: investor.type,
              totalCommitment: investor.totalCommitment,
            };
          }

          return {
            id: memberDoc.id,
            investorId: memberData.investorId,
            groupId: memberData.groupId,
            assignedAt: memberData.assignedAt,
            autoAssigned: memberData.autoAssigned,
            investor: investorData
          };
        })
      );

      logger.info('Retrieved LP group details', { userId, groupId });
      return {
        group: {
          ...groupData,
          members,
          memberCount: members.length
        }
      };
    } catch (error: any) {
      logger.error('Error getting LP group:', error);
      if (error.message === 'LP group not found') {
        throw error;
      }
      throw new Error('Failed to retrieve LP group');
    }
  }

  // Create new LP group
  static async createLPGroup(userId: string, groupData: Omit<LPGroup, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = FirestoreHelpers.serverTimestamp();
      const newGroup = {
        ...groupData,
        type: 'custom',
        autoAssign: groupData.autoAssign || false,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await FirestoreHelpers.getUserCollection(userId, 'lpGroups').add(newGroup);
      const createdGroup = await docRef.get();

      // If auto-assign is enabled, assign matching investors
      if (newGroup.autoAssign && groupData.criteria) {
        await this.assignInvestorsToGroup(docRef.id, userId, groupData.criteria);
      }

      logger.info('LP group created', { userId, groupId: docRef.id, name: groupData.name });

      return {
        group: {
          id: docRef.id,
          ...createdGroup.data(),
          members: [],
          memberCount: 0
        }
      };
    } catch (error: any) {
      logger.error('Error creating LP group:', error);
      throw new Error('Failed to create LP group');
    }
  }

  // Update LP group
  static async updateLPGroup(userId: string, groupId: string, updates: Partial<LPGroup>) {
    try {
      // Check if group exists and belongs to user
      const groupRef = FirestoreHelpers.getUserDocInCollection(userId, 'lpGroups', groupId);
      const groupDoc = await groupRef.get();

      if (!groupDoc.exists) {
        throw new Error('LP group not found');
      }

      const existingGroup = groupDoc.data();

      // Prevent modification of system groups
      if (existingGroup.type === 'system') {
        throw new Error('Cannot modify system groups');
      }

      const updateData = {
        ...updates,
        updatedAt: FirestoreHelpers.serverTimestamp(),
      };

      await groupRef.update(updateData);

      // Get updated group
      const updatedGroup = await groupRef.get();

      logger.info('LP group updated', { userId, groupId, updatedFields: Object.keys(updates) });

      return {
        group: {
          id: groupId,
          ...updatedGroup.data(),
          members: [], // TODO: Include members if needed
          memberCount: 0
        }
      };
    } catch (error: any) {
      logger.error('Error updating LP group:', error);
      if (error.message === 'LP group not found' || error.message === 'Cannot modify system groups') {
        throw error;
      }
      throw new Error('Failed to update LP group');
    }
  }

  // Delete LP group
  static async deleteLPGroup(userId: string, groupId: string) {
    try {
      // Check if group exists and belongs to user
      const groupRef = FirestoreHelpers.getUserDocInCollection(userId, 'lpGroups', groupId);
      const groupDoc = await groupRef.get();

      if (!groupDoc.exists) {
        throw new Error('LP group not found');
      }

      const existingGroup = groupDoc.data();

      // Prevent deletion of system groups
      if (existingGroup.type === 'system') {
        throw new Error('Cannot delete system groups');
      }

      // Delete all group memberships
      const membersSnapshot = await FirestoreHelpers.getUserCollection(userId, 'investorGroupMembers')
        .where('groupId', '==', groupId)
        .get();

      const batch = FirestoreHelpers.batch();

      // Delete memberships
      membersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete group
      batch.delete(groupRef);

      await batch.commit();

      logger.info('LP group deleted', { userId, groupId, name: existingGroup.name });

      return { message: 'LP group deleted successfully' };
    } catch (error: any) {
      logger.error('Error deleting LP group:', error);
      if (error.message === 'LP group not found' || error.message === 'Cannot delete system groups') {
        throw error;
      }
      throw new Error('Failed to delete LP group');
    }
  }

  // Add investor to group
  static async addInvestorToGroup(userId: string, groupId: string, investorId: string) {
    try {
      // Verify group exists and belongs to user
      const groupDoc = await FirestoreHelpers.getUserDocInCollection(userId, 'lpGroups', groupId).get();
      if (!groupDoc.exists) {
        throw new Error('LP group not found');
      }

      // Verify investor exists and belongs to user
      const investorDoc = await FirestoreHelpers.getUserDocInCollection(userId, 'investors', investorId).get();
      if (!investorDoc.exists) {
        throw new Error('Investor not found');
      }

      // Check if membership already exists
      const existingMembershipSnapshot = await FirestoreHelpers.getUserCollection(userId, 'investorGroupMembers')
        .where('investorId', '==', investorId)
        .where('groupId', '==', groupId)
        .get();

      if (!existingMembershipSnapshot.empty) {
        throw new Error('Investor is already in this group');
      }

      // Add investor to group
      await FirestoreHelpers.getUserCollection(userId, 'investorGroupMembers').add({
        investorId,
        groupId,
        autoAssigned: false,
        assignedAt: FirestoreHelpers.serverTimestamp(),
      });

      logger.info('Investor added to LP group', { userId, groupId, investorId });

      return { message: 'Investor added to group successfully' };
    } catch (error: any) {
      logger.error('Error adding investor to group:', error);
      if (error.message === 'LP group not found' ||
          error.message === 'Investor not found' ||
          error.message === 'Investor is already in this group') {
        throw error;
      }
      throw new Error('Failed to add investor to group');
    }
  }

  // Remove investor from group
  static async removeInvestorFromGroup(userId: string, groupId: string, investorId: string) {
    try {
      // Verify group exists and belongs to user
      const groupDoc = await FirestoreHelpers.getUserDocInCollection(userId, 'lpGroups', groupId).get();
      if (!groupDoc.exists) {
        throw new Error('LP group not found');
      }

      const group = groupDoc.data();

      // Don't allow removal from system "All Limited Partners" group
      if (group.type === 'system' && group.name === 'All Limited Partners') {
        throw new Error('Cannot remove investors from the default group');
      }

      // Remove investor from group
      const membershipSnapshot = await FirestoreHelpers.getUserCollection(userId, 'investorGroupMembers')
        .where('investorId', '==', investorId)
        .where('groupId', '==', groupId)
        .get();

      if (membershipSnapshot.empty) {
        throw new Error('Investor not found in this group');
      }

      const batch = FirestoreHelpers.batch();
      membershipSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      logger.info('Investor removed from LP group', { userId, groupId, investorId });

      return { message: 'Investor removed from group successfully' };
    } catch (error: any) {
      logger.error('Error removing investor from group:', error);
      if (error.message === 'LP group not found' ||
          error.message === 'Cannot remove investors from the default group' ||
          error.message === 'Investor not found in this group') {
        throw error;
      }
      throw new Error('Failed to remove investor from group');
    }
  }

  // Helper function to assign investors to group based on criteria
  private static async assignInvestorsToGroup(groupId: string, userId: string, criteria: any) {
    try {
      // Get all investors
      const investorsSnapshot = await FirestoreHelpers.getUserCollection(userId, 'investors').get();
      const investors = investorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter investors based on criteria
      const matchingInvestors = investors.filter((investor: any) => {
        let matches = true;

        // Filter by investor types
        if (criteria.investorTypes?.length > 0) {
          matches = matches && criteria.investorTypes.includes(investor.type);
        }

        // Filter by commitment range
        if (criteria.minCommitment && investor.totalCommitment) {
          matches = matches && investor.totalCommitment >= criteria.minCommitment;
        }
        if (criteria.maxCommitment && criteria.maxCommitment !== Infinity && investor.totalCommitment) {
          matches = matches && investor.totalCommitment <= criteria.maxCommitment;
        }

        // Filter by regions
        if (criteria.regions?.length > 0 && investor.location) {
          matches = matches && criteria.regions.includes(investor.location);
        }

        return matches;
      });

      // Create group memberships for matching investors
      const batch = FirestoreHelpers.batch();
      const now = FirestoreHelpers.serverTimestamp();

      matchingInvestors.forEach((investor) => {
        const memberRef = FirestoreHelpers.getUserCollection(userId, 'investorGroupMembers').doc();
        batch.set(memberRef, {
          investorId: investor.id,
          groupId,
          autoAssigned: true,
          assignedAt: now,
        });
      });

      if (matchingInvestors.length > 0) {
        await batch.commit();
      }

      logger.info('Auto-assigned investors to group', {
        groupId,
        count: matchingInvestors.length
      });
    } catch (error: any) {
      logger.error('Auto-assign investors error:', error);
    }
  }

  // Function to assign all existing investors to default group (for migration purposes)
  private static async assignAllExistingInvestorsToDefaultGroup(userId: string) {
    try {
      // Find all investors for this user
      const investorsSnapshot = await FirestoreHelpers.getUserCollection(userId, 'investors').get();

      if (investorsSnapshot.empty) {
        return; // No investors to assign
      }

      // Find or create the default group
      const defaultGroupSnapshot = await FirestoreHelpers.getUserCollection(userId, 'lpGroups')
        .where('type', '==', 'system')
        .where('name', '==', 'All Limited Partners')
        .get();

      let defaultGroupId: string;

      if (defaultGroupSnapshot.empty) {
        // Create the default group
        const defaultGroup = {
          name: 'All Limited Partners',
          description: 'Default group containing all Limited Partners',
          type: 'system',
          autoAssign: true,
          emailPreferences: {
            enableNotifications: true,
            frequency: 'monthly',
            types: ['quarterly_reports', 'capital_calls', 'performance_updates']
          },
          createdAt: FirestoreHelpers.serverTimestamp(),
          updatedAt: FirestoreHelpers.serverTimestamp(),
        };

        const groupRef = await FirestoreHelpers.getUserCollection(userId, 'lpGroups').add(defaultGroup);
        defaultGroupId = groupRef.id;
      } else {
        defaultGroupId = defaultGroupSnapshot.docs[0].id;
      }

      // Get existing memberships
      const existingMembershipsSnapshot = await FirestoreHelpers.getUserCollection(userId, 'investorGroupMembers')
        .where('groupId', '==', defaultGroupId)
        .get();

      const existingMemberInvestorIds = new Set(
        existingMembershipsSnapshot.docs.map(doc => doc.data().investorId)
      );

      // Find investors not in the default group
      const investorsToAdd = investorsSnapshot.docs.filter(doc =>
        !existingMemberInvestorIds.has(doc.id)
      );

      if (investorsToAdd.length > 0) {
        const batch = FirestoreHelpers.batch();
        const now = FirestoreHelpers.serverTimestamp();

        investorsToAdd.forEach((investorDoc) => {
          const memberRef = FirestoreHelpers.getUserCollection(userId, 'investorGroupMembers').doc();
          batch.set(memberRef, {
            investorId: investorDoc.id,
            groupId: defaultGroupId,
            autoAssigned: true,
            assignedAt: now,
          });
        });

        await batch.commit();

        logger.info('Assigned existing investors to default group', {
          userId,
          count: investorsToAdd.length
        });
      }
    } catch (error: any) {
      logger.error('Error assigning existing investors to default group:', error);
    }
  }
}