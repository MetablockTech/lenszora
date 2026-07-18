const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/sunglasses-marketplace');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const genderNames = ['Men', 'Women', 'Kids', 'Unisex'];

        const categories = await db.collection('categories').find({
            name: { $in: genderNames }
        }).toArray();

        console.log(`Found ${categories.length} categories matching gender names.`);

        for (const cat of categories) {
            const childrenCount = await db.collection('categories').countDocuments({ parentId: cat._id });
            const productsCount = await db.collection('products').countDocuments({ category: cat._id });

            // Find parent name
            let parentName = 'None';
            if (cat.parentId) {
                const parent = await db.collection('categories').findOne({ _id: cat.parentId });
                parentName = parent ? parent.name : 'Unknown';
            }

            console.log(`- Cat: "${cat.name}"`);
            console.log(`  _id: ${cat._id}`);
            console.log(`  Level: ${cat.level}`);
            console.log(`  Parent: ${parentName} (${cat.parentId})`);
            console.log(`  Children count: ${childrenCount}`);
            console.log(`  Products count: ${productsCount}`);

            if (productsCount > 0) {
                // Peek at some products to see if they have eyewearDetails.gender set
                const products = await db.collection('products').find({ category: cat._id }).limit(5).toArray();
                console.log(`  Peeking at products:`);
                products.forEach(p => {
                    const genderSet = p.eyewearDetails && p.eyewearDetails.gender;
                    console.log(`    * Product: "${p.title}", gender attribute: ${genderSet || 'NOT SET'}`);
                });
            }
            console.log('---');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
