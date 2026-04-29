const { PDFParse } = require('C:/Users/Admin_1/node_modules/pdf-parse');
const fs = require('fs');
const parser = new PDFParse({ verbosity: -1 });
parser.load(fs.readFileSync('./manual_dashboard_admin_maiz_pro.pdf')).then(async () => {
  const text = await parser.getText();
  console.log(JSON.stringify(text, null, 2));
}).catch(e => console.error(e.message || e));
