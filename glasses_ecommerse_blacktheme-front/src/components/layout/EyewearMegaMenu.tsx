import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, Baby, Sun, Eye, Glasses, Shapes, Tag } from "lucide-react";

interface SubSubCategory {
    _id: string;
    name: string;
    slug: string;
}

interface SubCategory {
    _id: string;
    name: string;
    slug: string;
    subcategories: SubSubCategory[];
}

interface MainCategory {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    subcategories: SubCategory[];
}

interface Brand {
    _id: string;
    name: string;
    slug: string;
}

interface NavSection {
    title: string;
    source: 'subcategories' | 'genders' | 'shapes' | 'brands' | 'custom';
    customLinks?: { label: string; url: string }[];
}

interface EyewearMegaMenuProps {
    categorySlug?: string;
    categories: MainCategory[];
    brands: Brand[];
    navConfig?: Record<string, NavSection[]>;
    onItemClick?: () => void;
}

const EyewearMegaMenu = ({ categorySlug = "", categories, brands, navConfig = {}, onItemClick }: EyewearMegaMenuProps) => {
    const currentCategory = categories.find(cat => cat.slug === categorySlug) || categories[0];

    if (!currentCategory) {
        return null;
    }

    // Get config for this category or use default
    const columns = navConfig[currentCategory._id] || [
        { title: 'Shop By Gender', source: 'genders' },
        { title: 'Shop By Type', source: 'subcategories' },
        { title: 'Shop By Shape', source: 'shapes' },
        { title: 'Popular Brands', source: 'brands' }
    ];

    const getIcon = (source: string) => {
        switch (source) {
            case 'genders': return Users;
            case 'subcategories': return Glasses;
            case 'shapes': return Shapes;
            case 'brands': return Tag;
            default: return Glasses;
        }
    };

    const renderColumnContent = (col: NavSection) => {
        switch (col.source) {
            case 'genders':
                return (
                    <ul className="space-y-2">
                        <li><Link to={`/shop?category=${currentCategory.slug}&gender=men`} onClick={onItemClick} className="text-sm text-slate-300 hover:text-gold transition-colors block py-1">Men</Link></li>
                        <li><Link to={`/shop?category=${currentCategory.slug}&gender=women`} onClick={onItemClick} className="text-sm text-slate-300 hover:text-gold transition-colors block py-1">Women</Link></li>
                        <li><Link to={`/shop?category=${currentCategory.slug}&gender=kids`} onClick={onItemClick} className="text-sm text-slate-300 hover:text-gold transition-colors block py-1">Kids</Link></li>
                        <li><Link to={`/shop?category=${currentCategory.slug}&gender=unisex`} onClick={onItemClick} className="text-sm text-slate-300 hover:text-gold transition-colors block py-1">Unisex</Link></li>
                    </ul>
                );
            case 'subcategories':
                return (
                    <ul className="space-y-2">
                        {currentCategory.subcategories.map((subCat) => (
                            <li key={subCat._id} className="group/item">
                                <Link
                                    to={`/shop?category=${currentCategory.slug}&subcategory=${subCat.slug}`}
                                    onClick={onItemClick}
                                    className="text-sm text-slate-300 hover:text-gold transition-colors block py-1 font-medium"
                                >
                                    {subCat.name}
                                </Link>
                                {subCat.subcategories.length > 0 && (
                                    <ul className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-3">
                                        {subCat.subcategories.slice(0, 4).map(ssc => (
                                            <li key={ssc._id}>
                                                <Link to={`/shop?category=${currentCategory.slug}&subcategory=${subCat.slug}&type=${ssc.slug}`} onClick={onItemClick} className="text-xs text-slate-400 hover:text-white transition-colors">
                                                    {ssc.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                );
            case 'shapes':
                return (
                    <ul className="space-y-2">
                        {['Rectangle', 'Square', 'Round', 'Cat-Eye', 'Aviator', 'Wayfarer'].map(shape => (
                            <li key={shape}>
                                <Link to={`/shop?category=${currentCategory.slug}&frameShape=${shape.toLowerCase()}`} onClick={onItemClick} className="text-sm text-slate-300 hover:text-gold transition-colors block py-1">
                                    {shape}
                                </Link>
                            </li>
                        ))}
                    </ul>
                );
            case 'brands':
                return (
                    <ul className="space-y-2">
                        {brands.slice(0, 8).map((brand) => (
                            <li key={brand._id}>
                                <Link
                                    to={`/shop?category=${currentCategory.slug}&brand=${brand.slug}`}
                                    onClick={onItemClick}
                                    className="text-sm text-slate-300 hover:text-gold transition-colors block py-1"
                                >
                                    {brand.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-full bg-black shadow-2xl border-t border-white/20 z-50"
        >
            <div className="container mx-auto py-10 px-6">
                <div className="grid grid-cols-5 gap-8">
                    {/* Category Intro */}
                    <div className="col-span-1 border-r border-white/10 pr-8">
                        <h2 className="text-2xl font-bold text-white mb-2">{currentCategory.name}</h2>
                        {currentCategory.description && (
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">{currentCategory.description}</p>
                        )}
                        <Link
                            to={`/shop?category=${currentCategory.slug}`}
                            onClick={onItemClick}
                            className="inline-block bg-white/10 hover:bg-gold text-white hover:text-black px-4 py-2 rounded text-xs font-bold transition-all uppercase tracking-widest"
                        >
                            Explore All
                        </Link>
                    </div>

                    {/* Dynamic Columns */}
                    <div className="col-span-4 grid grid-cols-4 gap-8">
                        {columns.map((col, idx) => {
                            const Icon = getIcon(col.source);
                            return (
                                <div key={idx}>
                                    <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-2">
                                        <Icon className="h-4 w-4 text-gold" />
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                            {col.title}
                                        </h3>
                                    </div>
                                    {renderColumnContent(col)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default EyewearMegaMenu;
