import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data, filename = 'Reporte_Personal_MinJuventud.xlsx') => {
  if (!data || data.length === 0) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  const formattedData = data.map((item, index) => ({
    'N°': item.numero_orden || (index + 1),
    'CÉDULA': item.cedula,
    'APELLIDO Y NOMBRE': item.apellido_nombre,
    'CATEGORÍA': item.categoria,
    'CARGO': item.cargo || '',
    'UNIDAD DE ADSCRIPCIÓN': item.unidad_adscripcion || '',
    'ESTADO': item.estado || '',
    'MUNICIPIO': item.municipio || '',
    'PARROQUIA': item.parroquia || '',
    'CENTRO DE VOTACIÓN': item.centro_votacion || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Anchos automáticos de columna
  const colWidths = [
    { wch: 6 },  // N°
    { wch: 14 }, // Cédula
    { wch: 34 }, // Nombre
    { wch: 16 }, // Categoría
    { wch: 30 }, // Cargo
    { wch: 36 }, // Unidad
    { wch: 18 }, // Estado
    { wch: 18 }, // Municipio
    { wch: 20 }, // Parroquia
    { wch: 35 }, // Centro
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Personal');
  XLSX.writeFile(workbook, filename);
};

export const exportToPdf = (data, activeFilters = {}, totalGeneral = 0) => {
  if (!data || data.length === 0) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Encabezado institucional
  doc.setFillColor(15, 23, 42); // Navy Dark
  doc.rect(0, 0, pageWidth, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('REPÚBLICA BOLIVARIANA DE VENEZUELA', 30, 24);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('MINISTERIO DEL PODER POPULAR PARA LA JUVENTUD - SISTEMA DE SEGUIMIENTO Y CONTROL', 30, 42);

  // Fecha y hora
  const now = new Date();
  const fechaStr = now.toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  doc.setFontSize(9);
  doc.text(`Generado: ${fechaStr}`, pageWidth - 160, 42);

  // Resumen de filtros
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`REPORTE DE FUNCIONARIOS (Total mostrados: ${data.length}${totalGeneral ? ` de ${totalGeneral}` : ''})`, 30, 82);

  let filterSummary = [];
  if (activeFilters.categoria) filterSummary.push(`Categoría: ${activeFilters.categoria}`);
  if (activeFilters.estado) filterSummary.push(`Estado: ${activeFilters.estado}`);
  if (activeFilters.municipio) filterSummary.push(`Municipio: ${activeFilters.municipio}`);
  if (activeFilters.parroquia) filterSummary.push(`Parroquia: ${activeFilters.parroquia}`);
  if (activeFilters.unidad_adscripcion) filterSummary.push(`Unidad: ${activeFilters.unidad_adscripcion}`);
  if (activeFilters.search) filterSummary.push(`Búsqueda: "${activeFilters.search}"`);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const filterText = filterSummary.length > 0 ? `Filtros aplicados: ${filterSummary.join(' | ')}` : 'Filtros aplicados: Ninguno (Todos los registros)';
  doc.text(filterText, 30, 96);

  // Tabla
  const headers = [['N°', 'CÉDULA', 'APELLIDO Y NOMBRE', 'CATEGORÍA', 'CARGO', 'UNIDAD ADSCRIPCIÓN', 'ESTADO', 'MUNICIPIO']];
  const tableData = data.map((item, index) => [
    item.numero_orden || (index + 1),
    item.cedula,
    item.apellido_nombre,
    item.categoria,
    item.cargo || '---',
    item.unidad_adscripcion || '---',
    item.estado || '---',
    item.municipio || '---'
  ]);

  autoTable(doc, {
    head: headers,
    body: tableData,
    startY: 110,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      font: 'helvetica',
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 30, right: 30 },
    didDrawPage: (dataInfo) => {
      const str = `Página ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - 60, doc.internal.pageSize.getHeight() - 15);
    }
  });

  doc.save(`Reporte_Personal_MinJuventud_${now.toISOString().slice(0, 10)}.pdf`);
};
