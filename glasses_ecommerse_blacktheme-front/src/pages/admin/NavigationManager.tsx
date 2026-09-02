import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { Loader2, Save, Plus, Trash2, MoveUp, MoveDown, Link as LinkIcon, RotateCcw } from 'lucide-react'
import { settings, categories, getToken } from '@/lib/api'

interface CustomLink {
    label: string
    url: string
}

interface NavSection {
    title: string
    source: 'subcategories' | 'genders' | 'shapes' | 'brands' | 'custom'
    customLinks?: CustomLink[]
}

const NavigationManager: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [mainCategories, setMainCategories] = useState<any[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
    const [navConfigs, setNavConfigs] = useState<Record<string, NavSection[]>>({})

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [cats, navSettings] = await Promise.all([
                categories.getMain(),
                settings.get('navigation_config').catch(() => ({ value: {} }))
            ])

            setMainCategories(cats || [])
            const loadedConfigs = navSettings?.value || {}
            setNavConfigs(loadedConfigs)

            if (cats && cats.length > 0) {
                setSelectedCategoryId(cats[0]._id)
            }
        } catch (error) {
            console.error('Failed to load navigation data:', error)
            toast.error('Failed to load navigation data')
        } finally {
            setLoading(false)
        }
    }

    const defaultColumns: NavSection[] = [
        { title: 'Shop By Gender', source: 'genders' },
        { title: 'Shop By Type', source: 'subcategories' },
        { title: 'Shop By Shape', source: 'shapes' },
        { title: 'Popular Brands', source: 'brands' }
    ]

    const currentColumns = selectedCategoryId && navConfigs[selectedCategoryId]
        ? navConfigs[selectedCategoryId]
        : defaultColumns

    function updateColumns(newColumns: NavSection[]) {
        if (!selectedCategoryId) return
        setNavConfigs(prev => ({
            ...prev,
            [selectedCategoryId]: newColumns
        }))
    }

    const addColumn = () => {
        if (!selectedCategoryId) {
            toast.error('Please select a category first')
            return
        }
        const updated = [...currentColumns, { title: 'New Section', source: 'subcategories' as const, customLinks: [] }]
        updateColumns(updated)
        toast.success('New column added')
    }

    const removeColumn = (index: number) => {
        const newCols = [...currentColumns]
        newCols.splice(index, 1)
        updateColumns(newCols)
    }

    const updateColumn = (index: number, field: keyof NavSection, value: any) => {
        const newCols = [...currentColumns]
        newCols[index] = { ...newCols[index], [field]: value }
        updateColumns(newCols)
    }

    const moveColumn = (index: number, direction: 'up' | 'down') => {
        const newCols = [...currentColumns]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= newCols.length) return

        const temp = newCols[index]
        newCols[index] = newCols[targetIndex]
        newCols[targetIndex] = temp
        updateColumns(newCols)
    }

    const addCustomLink = (colIndex: number) => {
        const newCols = [...currentColumns]
        const existingLinks = newCols[colIndex].customLinks || []
        newCols[colIndex].customLinks = [...existingLinks, { label: 'New Link', url: '/shop' }]
        updateColumns(newCols)
    }

    const updateCustomLink = (colIndex: number, linkIndex: number, field: keyof CustomLink, value: string) => {
        const newCols = [...currentColumns]
        const links = [...(newCols[colIndex].customLinks || [])]
        links[linkIndex] = { ...links[linkIndex], [field]: value }
        newCols[colIndex].customLinks = links
        updateColumns(newCols)
    }

    const removeCustomLink = (colIndex: number, linkIndex: number) => {
        const newCols = [...currentColumns]
        const links = [...(newCols[colIndex].customLinks || [])]
        links.splice(linkIndex, 1)
        newCols[colIndex].customLinks = links
        updateColumns(newCols)
    }

    const resetToDefaults = () => {
        if (!selectedCategoryId) return
        updateColumns(defaultColumns)
        toast.info('Reset to default columns layout')
    }

    async function handleSave() {
        setSaving(true)
        const token = getToken()
        try {
            await settings.update('navigation_config', {
                value: navConfigs,
                category: 'navigation',
                type: 'json'
            }, token)
            toast.success('Navigation configuration saved successfully')
        } catch (error) {
            toast.error('Failed to save configuration')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const selectedCategoryName = mainCategories.find(c => c._id === selectedCategoryId)?.name || 'selected category'

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Navigation Management</h2>
                    <p className="text-slate-500">Customize the mega menu sections for each category.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save All Configs
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-sm">Main Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            {mainCategories.map((cat) => (
                                <button
                                    key={cat._id}
                                    onClick={() => setSelectedCategoryId(cat._id)}
                                    className={`px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${selectedCategoryId === cat._id ? 'bg-blue-50 text-blue-700 font-bold border-r-2 border-blue-700' : 'text-slate-600'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Mega Menu Columns</CardTitle>
                            <CardDescription>
                                Define columns for <span className="font-semibold text-slate-900">{selectedCategoryName}</span>
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={resetToDefaults} title="Reset to Default Layout">
                                <RotateCcw className="h-4 w-4 mr-1 text-slate-500" /> Reset
                            </Button>
                            <Button variant="outline" size="sm" onClick={addColumn} disabled={!selectedCategoryId} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                                <Plus className="mr-2 h-4 w-4" /> Add Column
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {currentColumns.map((col, idx) => (
                            <div key={idx} className="flex flex-col gap-4 p-4 border rounded-lg bg-slate-50/50">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col gap-1 mt-2">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveColumn(idx, 'up')} disabled={idx === 0}>
                                            <MoveUp className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveColumn(idx, 'down')} disabled={idx === currentColumns.length - 1}>
                                            <MoveDown className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-600">Column Title</Label>
                                            <Input
                                                value={col.title}
                                                onChange={(e) => updateColumn(idx, 'title', e.target.value)}
                                                placeholder="e.g. Shop By Gender"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-slate-600">Data Source</Label>
                                            <Select
                                                value={col.source}
                                                onValueChange={(val) => updateColumn(idx, 'source', val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="genders">Gender List (Men, Women, Kids)</SelectItem>
                                                    <SelectItem value="subcategories">Database Sub-categories</SelectItem>
                                                    <SelectItem value="shapes">Frame Shapes (Eyewear specific)</SelectItem>
                                                    <SelectItem value="brands">Popular Brands</SelectItem>
                                                    <SelectItem value="custom">Custom Links</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-6"
                                        onClick={() => removeColumn(idx)}
                                        title="Remove Column"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Custom Links Editor if source === 'custom' */}
                                {col.source === 'custom' && (
                                    <div className="ml-10 p-3 bg-white border border-slate-200 rounded-md space-y-3">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                                <LinkIcon className="w-3.5 h-3.5" /> Custom Links
                                            </span>
                                            <Button variant="outline" size="sm" onClick={() => addCustomLink(idx)} className="h-7 text-xs">
                                                <Plus className="w-3 h-3 mr-1" /> Add Link
                                            </Button>
                                        </div>
                                        {(col.customLinks || []).length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No custom links added yet. Click "Add Link" above.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {(col.customLinks || []).map((link, lIdx) => (
                                                    <div key={lIdx} className="flex items-center gap-2">
                                                        <Input
                                                            value={link.label}
                                                            onChange={(e) => updateCustomLink(idx, lIdx, 'label', e.target.value)}
                                                            placeholder="Label (e.g. New Arrivals)"
                                                            className="h-8 text-xs flex-1"
                                                        />
                                                        <Input
                                                            value={link.url}
                                                            onChange={(e) => updateCustomLink(idx, lIdx, 'url', e.target.value)}
                                                            placeholder="URL (e.g. /shop?featured=true)"
                                                            className="h-8 text-xs flex-1 font-mono"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                            onClick={() => removeCustomLink(idx, lIdx)}
                                                        >
                                                            <Trash2 className="h-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {currentColumns.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg text-slate-400">
                                No columns defined. Click "Add Column" to start.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default NavigationManager
