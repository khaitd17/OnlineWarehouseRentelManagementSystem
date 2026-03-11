const fs = require('fs');
const https = require('https');
const path = require('path');

const screens = [
  { name: 'ConfirmMovement', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzQ3ZGIzNWRhYTc4ZTQ0ZTU5YjFhNzJkNmUzYzI2NWMzEgsSBxDW7b_iqAUYAZIBIgoKcHJvamVjdF9pZBIUQhI5NDYwMjA0OTQ4MjUwMjA3NjY&filename=&opi=89354086' },
  { name: 'OutboundRequestsList', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzg4MGZlZjE4MzU2NzRhOThiYmU3ZjliMTBkOTU0ZjQ2EgsSBxDW7b_iqAUYAZIBIgoKcHJvamVjdF9pZBIUQhI5NDYwMjA0OTQ4MjUwMjA3NjY&filename=&opi=89354086' },
  { name: 'InboundRequestsManagement', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzBmM2RiZmQwMDdiNjQwOGI5YTIzNWRiYjk1MzljODY0EgsSBxDW7b_iqAUYAZIBIgoKcHJvamVjdF9pZBIUQhI5NDYwMjA0OTQ4MjUwMjA3NjY&filename=&opi=89354086' },
  { name: 'CreateOutboundRequest', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzU0OTcxMGVjMzVlNjQyYzk4YTg5NjQ1MzZkN2ExNTU2EgsSBxDW7b_iqAUYAZIBIgoKcHJvamVjdF9pZBIUQhI5NDYwMjA0OTQ4MjUwMjA3NjY&filename=&opi=89354086' },
  { name: 'StaffDashboard', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sX2VmN2Y3MDMwN2IyNDQ5ZDlhMjljMjE2OGM5MTc2MWM3EgsSBxDW7b_iqAUYAZIBIgoKcHJvamVjdF9pZBIUQhI5NDYwMjA0OTQ4MjUwMjA3NjY&filename=&opi=89354086' },
  { name: 'RenterDashboard', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzdkMzc3YjMzOTJjODRjNzQ4MTBmMjI3NWNiOThiMjI2EgsSBxDW7b_iqAUYAZIBIgoKcHJvamVjdF9pZBIUQhI5NDYwMjA0OTQ4MjUwMjA3NjY&filename=&opi=89354086' },
  { name: 'CreateInboundRequest', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzc3ZTAyNGQ3ZjcxODRlNjBhMmY5NTM1YjMxZjk5ZjgyEgsSBxDW7b_iqAUYAZIBIgoKcHJvamVjdF9pZBIUQhI5NDYwMjA0OTQ4MjUwMjA3NjY&filename=&opi=89354086' },
  { name: 'TransactionHistory', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzZmZjdmYTcwMDYxMTRmMmZhMzA3NjAwNjU1NWNjMWUxEgsSBxDW7b_iqAUYAZIBIgoKcHJvamVjdF9pZBIUQhI5NDYwMjA0OTQ4MjUwMjA3NjY&filename=&opi=89354086' }
];

const downloadHTML = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => reject(err));
  });
};

const htmlToJsx = (html) => {
  let jsx = html;
  
  // Trích xuất thẻ main (thường bao gồm header + content)
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  if (mainMatch) {
    jsx = `<div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>\n${mainMatch[1]}\n</div>`;
  }

  // Convert HTML attrs to JSX
  jsx = jsx.replace(/class="/g, 'className="');
  jsx = jsx.replace(/for="/g, 'htmlFor="');
  jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}'); // comments
  
  // Self closing tags fix
  const tagsToClose = ['img', 'input', 'br', 'hr'];
  tagsToClose.forEach(tag => {
    const regex = new RegExp(`<${tag}([^>]*[^/])>`, 'gi');
    jsx = jsx.replace(regex, `<${tag}$1/>`);
  });

  // Tạm xử lý inline style nếu có (khó hoàn hảo nhưng sẽ remove bớt)
  jsx = jsx.replace(/style="([^"]*)"/g, (match, p1) => {
      // Very basic translation. Ignoring for simplicity and returning safe style
      return "";
  });
  
  // Fix React HTML Attributes issue
  jsx = jsx.replace(/stroke-width/g, "strokeWidth");
  jsx = jsx.replace(/stroke-linecap/g, "strokeLinecap");
  jsx = jsx.replace(/stroke-linejoin/g, "strokeLinejoin");
  jsx = jsx.replace(/xmlns:xlink/g, "xmlnsXlink");

  return jsx;
};

async function buildScreens() {
  for (const screen of screens) {
    console.log(`Downloading ${screen.name}...`);
    try {
      const html = await downloadHTML(screen.url);
      const jsxContent = htmlToJsx(html);
      
      const componentCode = `import React from 'react';\n\nconst ${screen.name} = () => {\n  return (\n    ${jsxContent}\n  );\n};\n\nexport default ${screen.name};\n`;
      
      const filePath = path.join('c:\\Github\\OnlineWarehouseRentelManagementSystem\\frontend\\src\\pages\\Requests', `${screen.name}.jsx`);
      fs.writeFileSync(filePath, componentCode);
      console.log(`Saved ${filePath}`);
    } catch (e) {
      console.error('Error for ' + screen.name, e);
    }
  }
}

buildScreens();
