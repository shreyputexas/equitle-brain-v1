import jsPDF from 'jspdf';

export interface FundData {
  id: string;
  name: string;
  vintage: number;
  targetSize: number;
  raisedAmount: number;
  status: string;
  investorCount: number;
  investments?: any[];
}

export const generateFundsPDF = (funds: FundData[], title: string = 'Funds Portfolio Report') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 30;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 20;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 20;

  // Summary Statistics
  const totalAUM = funds.reduce((sum, fund) => sum + fund.raisedAmount, 0);
  const totalTarget = funds.reduce((sum, fund) => sum + fund.targetSize, 0);
  const totalInvestors = funds.reduce((sum, fund) => sum + fund.investorCount, 0);
  const activeFunds = funds.filter(fund => fund.status === 'Active').length;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Portfolio Summary', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Funds: ${funds.length}`, 20, yPosition);
  doc.text(`Active Funds: ${activeFunds}`, 20, yPosition + 10);
  doc.text(`Total AUM: $${(totalAUM / 1000000).toFixed(0)}M`, 20, yPosition + 20);
  doc.text(`Total Target: $${(totalTarget / 1000000).toFixed(0)}M`, 20, yPosition + 30);
  doc.text(`Total Investors: ${totalInvestors}`, 20, yPosition + 40);

  yPosition += 60;

  // Fund Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Fund Details', 20, yPosition);
  yPosition += 15;

  // Table headers
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Fund Name', 20, yPosition);
  doc.text('Vintage', 80, yPosition);
  doc.text('Target Size', 110, yPosition);
  doc.text('Raised', 140, yPosition);
  doc.text('Progress', 165, yPosition);
  doc.text('Status', 185, yPosition);

  yPosition += 10;

  // Draw line under headers
  doc.line(20, yPosition - 2, pageWidth - 20, yPosition - 2);

  yPosition += 5;

  // Fund data
  doc.setFont('helvetica', 'normal');
  funds.forEach((fund, index) => {
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = 30;
    }

    const progress = ((fund.raisedAmount / fund.targetSize) * 100).toFixed(1);

    doc.text(fund.name.substring(0, 25), 20, yPosition);
    doc.text(fund.vintage.toString(), 80, yPosition);
    doc.text(`$${(fund.targetSize / 1000000).toFixed(0)}M`, 110, yPosition);
    doc.text(`$${(fund.raisedAmount / 1000000).toFixed(0)}M`, 140, yPosition);
    doc.text(`${progress}%`, 165, yPosition);
    doc.text(fund.status, 185, yPosition);

    yPosition += 12;
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'Confidential - Equitle Fund Management',
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }

  return doc;
};

export const downloadFundsPDF = (funds: FundData[], filename?: string) => {
  const doc = generateFundsPDF(funds);
  const fileName = filename || `funds_portfolio_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};