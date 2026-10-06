const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'ClientDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update English translation
content = content.replace(/categoryGelato: 'Gelato',\s+categoryCafe: 'Coffee',\s+categoryPanini: 'Panini',\s+categoryWaffles: 'Waffles',/g, 
  "categoryPostres: 'Desserts',\n    categoryDeslactosados: 'Lactose-Free',\n    categoryCheesecakes: 'Cheesecakes',\n    categoryOtros: 'Other Desserts',");

// Update Product type
const typeRegex = /category: 'gelato' \| 'cafe' \| 'panini' \| 'waffles';/g;
content = content.replace(typeRegex, "category: string;");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed categories!');
