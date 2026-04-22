const db = require('../db');

// product_id => { main image, [gallery images] }
const productImages = {
  // ELECTRONICS
  1:  { main: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80','https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'] },
  2:  { main: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=800&q=80','https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=80'] },
  3:  { main: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&q=80','https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=800&q=80'] },
  4:  { main: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80','https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80'] },
  5:  { main: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80','https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&q=80'] },
  6:  { main: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80','https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=800&q=80'] },
  7:  { main: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80','https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&q=80'] },
  8:  { main: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'] },
  9:  { main: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=800&q=80','https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80'] },
  10: { main: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1615750173730-b3c5a3e5e5e5?w=800&q=80','https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'] },

  // COSMETICS
  11: { main: 'https://images.unsplash.com/photo-1586495777744-4e6232bf2f9b?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1631214524020-3c69b3b0e5e5?w=800&q=80','https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80'] },
  12: { main: 'https://images.unsplash.com/photo-1631214524020-3c69b3b0e5e5?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80','https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80'] },
  13: { main: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80','https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80'] },
  14: { main: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1583241475880-083f84372725?w=800&q=80','https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'] },
  15: { main: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80','https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80'] },
  16: { main: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80','https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80'] },
  17: { main: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80','https://images.unsplash.com/photo-1583241475880-083f84372725?w=800&q=80'] },
  18: { main: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80','https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80'] },
  19: { main: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80','https://images.unsplash.com/photo-1631214524020-3c69b3b0e5e5?w=800&q=80'] },
  20: { main: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80','https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80'] },

  // FASHION
  21: { main: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&q=80','https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80'] },
  22: { main: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800&q=80','https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&q=80'] },
  23: { main: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80','https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&q=80'] },
  24: { main: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80','https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80'] },
  25: { main: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&q=80','https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&q=80'] },
  26: { main: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80','https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80'] },
  27: { main: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&q=80','https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80'] },
  28: { main: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80','https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80'] },
  29: { main: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80','https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=80'] },
  30: { main: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80','https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80'] },

  // HOME & KITCHEN
  31: { main: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80','https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80'] },
  32: { main: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'] },
  33: { main: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'] },
  34: { main: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80','https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80'] },
  35: { main: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80','https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80'] },
  36: { main: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80','https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80'] },
  37: { main: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'] },
  38: { main: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80','https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80'] },
  39: { main: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80','https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80'] },
  40: { main: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80'] },

  // SPORTS
  41: { main: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80','https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80'] },
  42: { main: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80','https://images.unsplash.com/photo-1617083934555-ac7b4d500f7e?w=800&q=80'] },
  43: { main: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80','https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=800&q=80'] },
  44: { main: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80','https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80'] },
  45: { main: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80','https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&q=80'] },
  46: { main: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80','https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80'] },
  47: { main: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80','https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80'] },
  48: { main: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80','https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&q=80'] },
  49: { main: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1540747913346-19212a4cf528?w=800&q=80','https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&q=80'] },
  50: { main: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80','https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'] },

  // BOOKS
  51: { main: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80','https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80'] },
  52: { main: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80','https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80'] },
  53: { main: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80','https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80'] },
  54: { main: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80','https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=80'] },
  55: { main: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80','https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80'] },
  56: { main: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=80','https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80'] },
  57: { main: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80','https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80'] },
  58: { main: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=80','https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80'] },
  59: { main: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80','https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&q=80'] },
  60: { main: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80','https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80'] }
};

async function run() {
  const db = require('../db');
  console.log('Updating product images...');

  // Clear old gallery images
  await new Promise((res, rej) => db.query('DELETE FROM product_images', (e) => e ? rej(e) : res()));

  for (const [id, imgs] of Object.entries(productImages)) {
    // Update main image
    await new Promise((res, rej) => db.query('UPDATE products SET image = ? WHERE id = ?', [imgs.main, id], (e) => e ? rej(e) : res()));
    // Insert gallery images
    for (let i = 0; i < imgs.gallery.length; i++) {
      await new Promise((res, rej) => db.query('INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)', [id, imgs.gallery[i], i+1], (e) => e ? rej(e) : res()));
    }
    process.stdout.write('.');
  }

  console.log('\nDone! All 60 products updated with correct images.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
