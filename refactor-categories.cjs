const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'ClientDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Translations (ES)
content = content.replace(/categoryGelato: 'Gelatos',\s+categoryCafe: 'Cafetería',\s+categoryPanini: 'Paninis',\s+categoryWaffles: 'Waffles',/g, 
  "categoryPostres: 'Postres',\n    categoryDeslactosados: 'Deslactosados',\n    categoryCheesecakes: 'Cheesecakes',\n    categoryOtros: 'Otros Postres',");

// 2. Update Translations (EN)
content = content.replace(/categoryGelato: 'Gelato',\s+categoryCafe: 'Cafe',\s+categoryPanini: 'Paninis',\s+categoryWaffles: 'Waffles',/g, 
  "categoryPostres: 'Desserts',\n    categoryDeslactosados: 'Lactose-Free',\n    categoryCheesecakes: 'Cheesecakes',\n    categoryOtros: 'Other Desserts',");

// 3. Update categoryDisplayNames
const catDispRegex = /const categoryDisplayNames = \{\s+gelato: t\.categoryGelato,\s+cafe: t\.categoryCafe,\s+panini: t\.categoryPanini,\s+waffles: t\.categoryWaffles\s+\};/g;
content = content.replace(catDispRegex, `const categoryDisplayNames: Record<string, string> = {
    'Postres': t.categoryPostres,
    'Deslactosados': t.categoryDeslactosados,
    'Cheesecakes': t.categoryCheesecakes,
    'Otros Postres': t.categoryOtros
  };`);

// 4. Update selectedCategory state
const stateRegex = /const \[selectedCategory, setSelectedCategory\] = useState\<'gelato' \| 'cafe' \| 'panini' \| 'waffles'\>\('gelato'\);/g;
content = content.replace(stateRegex, "const [selectedCategory, setSelectedCategory] = useState<string>('Postres');");

// 5. Update fallbackProducts
const fallbackProdRegex = /const fallbackProducts: Product\[\] = \[\s*\{\s*id: '1',[\s\S]*?\];/g;
content = content.replace(fallbackProdRegex, `const fallbackProducts: Product[] = [
    {
      id: '1',
      name: 'Fresa (Chico)',
      description: 'Postre de fresa tamaño chico',
      category: 'Postres',
      tags: [],
      image_url: 'https://images.unsplash.com/photo-1563805042-7684c8e9e9cb?auto=format&fit=crop&q=80&w=400',
      is_active: true
    }
  ];`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Categories updated!');
