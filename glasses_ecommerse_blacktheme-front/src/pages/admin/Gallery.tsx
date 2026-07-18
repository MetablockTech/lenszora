import React, { useEffect, useState } from 'react'
import { gallery, products } from '@/lib/api'
import { getToken, getImageUrl } from '@/lib/utils'
import { Folder, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import folderIcon from '@/assets/folder-custom.png'

interface GalleryItem {
    name: string
    path: string
    size?: number
    children?: GalleryItem[]
}

const GalleryPage = () => {
    const [data, setData] = useState<GalleryItem | null>(null)
    const [currentFolder, setCurrentFolder] = useState<GalleryItem | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const itemsPerPage = 24
    const token = getToken()

    useEffect(() => {
        fetchGallery()
    }, [])

    const fetchGallery = async () => {
        if (!token) return
        setLoading(true)
        try {
            const res = await gallery.list(token)
            setData(res)

            // If we are currently in a folder, try to find it in the new data to stay there
            if (currentFolder) {
                const findFolder = (item: GalleryItem, path: string): GalleryItem | null => {
                    if (item.path === path) return item
                    if (item.children) {
                        for (const child of item.children) {
                            const found = findFolder(child, path)
                            if (found) return found
                        }
                    }
                    return null
                }
                const updatedFolder = findFolder(res, currentFolder.path)
                if (updatedFolder) setCurrentFolder(updatedFolder)
                else setCurrentFolder(res)
            } else {
                setCurrentFolder(res)
            }
        } catch (error) {
            toast.error('Failed to fetch gallery')
        } finally {
            setLoading(false)
        }
    }

    const setFolder = (folder: GalleryItem) => {
        setCurrentFolder(folder)
        setCurrentPage(1)
        setSearchQuery('')
    }

    const FolderIcon = ({ className }: { className?: string }) => (
        <img src={folderIcon} className={className} alt="Folder" />
    )

    if (loading) return (
        <div className="p-20 text-center text-slate-400 flex flex-col items-center gap-4 bg-white min-h-screen">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-medium text-slate-600">Loading media library...</p>
        </div>
    )

    const allFolders = currentFolder?.children?.filter(c => c.children) || []
    const allFilesList = currentFolder?.children?.filter(c => !c.children) || []

    const folders = allFolders.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const allFiles = allFilesList.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const totalPages = Math.ceil(allFiles.length / itemsPerPage)
    const files = allFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    const isRoot = currentFolder?.path === data?.path

    return (
        <div className="bg-[#F8F9FB] min-h-screen font-sans">
            <div className="p-6 md:p-8 max-w-[1800px] mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 text-lg font-bold text-blue-600">
                        <span className="cursor-pointer hover:underline" onClick={() => setFolder(data!)}>Public</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-700">{currentFolder?.name || 'Product'}</span>
                        <span className="bg-[#1C5BBA] text-white text-xs px-2 py-0.5 rounded-md ml-1">
                            {(currentFolder?.children?.length || 0)}
                        </span>
                    </div>

                    <div className="flex-1 max-w-xl w-full mx-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search with item name"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full pl-4 pr-10 py-2.5 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all text-slate-900"
                            />

                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            </div>
                        </div>
                    </div>


                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[75vh]">
                    {folders.length === 0 && allFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-6">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                                <Folder className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-medium">No items found in this folder</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-10">
                            {/* Render Folders */}
                            {folders.map((item, idx) => (
                                <div
                                    key={`folder-${idx}`}
                                    className="flex flex-col items-center gap-3 cursor-pointer group"
                                    onClick={() => setFolder(item)}
                                >
                                    <div className="w-full aspect-[4/3] flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                                        <FolderIcon className="w-3/4 h-auto drop-shadow-md" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-slate-800 text-base">{item.name}</p>
                                        <p className="text-sm text-slate-400 font-medium">{item.children?.length || 0} {item.children?.length === 1 ? 'Item' : 'Items'}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Render Files */}
                            {files.map((item, idx) => (
                                <div key={`file-${idx}`} className="flex flex-col gap-3 group">
                                    <div className="relative aspect-square bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                        <div className="absolute inset-0 p-4 flex items-center justify-center">
                                            <img
                                                src={getImageUrl(item.path)}
                                                alt={item.name}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>

                                        {/* Overlay & Actions */}
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-[1px]">
                                            <div className="absolute right-3 top-3 flex flex-col gap-2">
                                                <button
                                                    className="w-9 h-9 bg-white rounded-lg flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(getImageUrl(item.path));
                                                        toast.success('Link copied');
                                                    }}
                                                    title="Copy Link"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                                </button>
                                                <button
                                                    className="w-9 h-9 bg-white rounded-lg flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(getImageUrl(item.path), '_blank');
                                                    }}
                                                    title="Preview"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                                </button>
                                                <a
                                                    href={getImageUrl(item.path)}
                                                    download
                                                    className="w-9 h-9 bg-white rounded-lg flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Download"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 text-center truncate px-2">{item.name}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-12 gap-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded-md text-sm font-bold transition-colors ${currentPage === i + 1
                                        ? 'bg-[#1C5BBA] text-white'
                                        : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GalleryPage
