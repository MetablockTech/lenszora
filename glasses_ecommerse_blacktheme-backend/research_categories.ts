import mongoose from 'mongoose';
import * as fs from 'fs';

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/sunglasses-marketplace');
        const db = mongoose.connection.db;
        const genderNames = ['Men', 'Women', 'Kids', 'Unisex'];

        const log = (msg: string) => {
            console.log(msg);
            fs.appendFileSync('research_results.txt', msg + '\n', 'utf8');
        };

        if (fs.existsSync('research_results.txt')) fs.unlinkSync('research_results.txt');

        log('Connected to MongoDB');

        const categories = await db.collection('categories').find({
            name: { $in: genderNames }
        }).toArray();

        log(`Found ${categories.length} categories matching gender names.`);

        for (const cat of categories) {
            const childrenCount = await db.collection('categories').countDocuments({ parentId: cat._id });
            const productsCount = await db.collection('products').countDocuments({ category: cat._id });

            // Find parent name
            let parentName = 'None';
            if (cat.parentId) {
                const parent = await db.collection('categories').findOne({ _id: cat.parentId });
                parentName = parent ? parent.name : 'Unknown';
            }

            log(`- Cat: "${cat.name}"`);
            log(`  _id: ${cat._id}`);
            log(`  Level: ${cat.level}`);
            log(`  Parent: ${parentName} (${cat.parentId})`);
            log(`  Children count: ${childrenCount}`);
            log(`  Products count: ${productsCount}`);

            if (productsCount > 0) {
                // Peek at some products to see if they have eyewearDetails.gender set
                const products: any[] = await db.collection('products').find({ category: cat._id }).limit(5).toArray();
                log(`  Peeking at products:`);
                products.forEach(p => {
                    const genderSet = p.eyewearDetails && p.eyewearDetails.gender;
                    log(`    * Product: "${p.title}", gender attribute: ${genderSet || 'NOT SET'}`);
                });
            }
            log('---');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
