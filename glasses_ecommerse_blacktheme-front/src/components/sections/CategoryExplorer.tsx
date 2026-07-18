import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { categories } from "@/lib/api";
import { ChevronRight, ArrowRight, Layers } from "lucide-react";

interface Category {
    _id: string;
    name: string;
    slug: string;
    image?: string;
    subcategories?: Category[];
}

const CategoryExplorer = () => {
    const [hierarchy, setHierarchy] = useState<Category[]>([]);
    const [selectedMain, setSelectedMain] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHierarchy();
    }, []);

    async function fetchHierarchy() {
        try {
            const data = await categories.getHierarchy();
            setHierarchy(data.categories || []);
            if (data.categories && data.categories.length > 0) {
                setSelectedMain(data.categories[0]);
            }
        } catch (error) {
            console.error("Failed to fetch hierarchy:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return (
        <div className="container mx-auto px-4 py-20">
            <div className="h-96 bg-slate-800/30 rounded-2xl animate-pulse" />
        </div>
    );

    if (hierarchy.length === 0) return null;

    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    {/* Sidebar - Main Categories */}
                    <div className="w-full lg:w-1/3 lg:sticky lg:top-24">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center gap-2 text-primary text-sm font-semibold tracking-widest uppercase mb-4">
                                <Layers className="w-4 h-4" />
                                <span>Collections</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-playfair mb-8 leading-tight">
                                Explore Our <br />
                                <span className="gold-gradient-text">Curated Selection</span>
                            </h2>

                            <div className="space-y-4">
                                {hierarchy.map((cat) => (
                                    <button
                                        key={cat._id}
                                        onClick={() => setSelectedMain(cat)}
                                        className={`flex items-center justify-between w-full p-5 rounded-xl transition-all duration-300 group ${selectedMain?._id === cat._id
                                                ? "bg-primary text-black"
                                                : "bg-slate-900/40 hover:bg-slate-800/60 text-slate-400"
                                            }`}
                                    >
                                        <span className="text-lg font-medium">{cat.name}</span>
                                        <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${selectedMain?._id === cat._id ? "translate-x-1" : "group-hover:translate-x-1"
                                            }`} />
                                    </button>
                                ))}
                            </div>

                            <div className="mt-10 p-6 rounded-2xl border border-primary/20 bg-primary/5">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Find the perfect pair that matches your unique style and vision requirements.
                                </p>
                                <a href="/shop" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
                                    View Full Shop <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </motion.div>
                    </div>

                    {/* Main Area - Subcategories */}
                    <div className="w-full lg:w-2/3">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedMain?._id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.4 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {selectedMain?.subcategories && selectedMain.subcategories.length > 0 ? (
                                    selectedMain.subcategories.map((sub, idx) => (
                                        <a
                                            key={sub._id}
                                            href={`/shop?category=${sub._id}`}
                                            className="group relative h-72 rounded-3xl overflow-hidden shadow-2xl block"
                                        >
                                            <div className="absolute inset-0 bg-slate-900/60 group-hover:bg-slate-900/40 transition-colors duration-500 z-10" />
                                            <div
                                                className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                                                style={{
                                                    backgroundImage: `url(${sub.image || selectedMain.image || "https://images.unsplash.com/photo-1511499767350-a1590fdb730a?auto=format&fit=crop&q=80&w=800"})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center'
                                                }}
                                            />

                                            <div className="absolute inset-x-0 bottom-0 p-8 z-20">
                                                <h4 className="text-2xl font-semibold text-white mb-2 group-hover:text-primary transition-colors">
                                                    {sub.name}
                                                </h4>
                                                <span className="flex items-center gap-2 text-primary text-sm font-medium opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                                    Shop Now <ArrowRight className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </a>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 text-center bg-slate-900/30 rounded-3xl border border-slate-800">
                                        <p className="text-slate-500">Discover all {selectedMain?.name} accessories and collections.</p>
                                        <a href={`/shop?category=${selectedMain?._id}`} className="btn-gold mt-6 inline-block py-3 px-8 rounded-full">Explore {selectedMain?.name}</a>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CategoryExplorer;
