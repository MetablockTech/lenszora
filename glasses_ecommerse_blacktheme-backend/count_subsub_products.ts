import mongoose from 'mongoose';
import * as fs from 'fs';

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/sunglasses-marketplace');
        const db = mongoose.connection.db;

        const log = (msg: string) => {
            console.log(msg);
            fs.appendFileSync('subsub_product_counts.txt', msg + '\n', 'utf8');
        };

        if (fs.existsSync('subsub_product_counts.txt')) fs.unlinkSync('subsub_product_counts.txt');

        const subsubCats = await db.collection('categories').find({ level: 'subsub' }).toArray();
        log(`Found ${subsubCats.length} sub-subcategories.`);

        for (const cat of subsubCats) {
            const count = await db.collection('products').countDocuments({ category: cat._id });
            const parent = await db.collection('categories').findOne({ _id: cat.parentId });
            const grandParent = parent ? await db.collection('categories').findOne({ _id: parent.parentId }) : null;

            log(`- "${cat.name}" (Count: ${count})`);
            log(`  Path: ${grandParent ? grandParent.name : '?'} > ${parent ? parent.name : '?'} > ${cat.name}`);
            log(`  _id: ${cat._id}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
