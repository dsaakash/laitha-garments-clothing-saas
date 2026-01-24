'use client'

import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '@/components/AdminLayout'

interface Category {
  id: string
  name: string
  description: string
  parentId: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
}

interface CategoryNode extends Category {
  children: CategoryNode[]
  level: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    displayOrder: 0,
  })

  useEffect(() => {
    loadCategories()
  }, [])

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        resetForm()
        setShowModal(false)
      }
    }

    if (showModal) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [showModal])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const result = await response.json()
      if (result.success) {
        setCategories(result.data)
      } else {
        console.error('Failed to load categories:', result.message)
        if (result.message && result.message.includes('does not exist')) {
          alert('Categories table not found. Please run: npm run migrate-categories')
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Category name is required')
      return
    }
    
    try {
      if (editingCategory) {
        const response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || undefined,
        }),
        })
        const result = await response.json()
        if (!result.success) {
          alert(result.message || 'Failed to update category')
          return
        }
      } else {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || undefined,
        }),
        })
        const result = await response.json()
        if (!result.success) {
          alert(result.message || 'Failed to add category')
          return
        }
      }
      
      resetForm()
      await loadCategories()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save category:', error)
      alert('Failed to save category')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId || '',
      displayOrder: category.displayOrder || 0,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        const response = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
        })
        const result = await response.json()
        if (!result.success) {
          alert(result.message || 'Failed to delete category')
          return
        }
        await loadCategories()
      } catch (error) {
        console.error('Failed to delete category:', error)
        alert('Failed to delete category')
      }
    }
  }

  // Build tree structure from flat list
  const categoryTree = useMemo(() => {
    const buildTree = (categories: Category[]): CategoryNode[] => {
      const map = new Map<string, CategoryNode>()
      const roots: CategoryNode[] = []
      
      // Create nodes
      categories.forEach(cat => {
        map.set(cat.id, { ...cat, children: [], level: 0 })
      })
      
      // Build tree
      categories.forEach(cat => {
        const node = map.get(cat.id)!
        if (cat.parentId && map.has(cat.parentId)) {
          const parent = map.get(cat.parentId)!
          parent.children.push(node)
          node.level = parent.level + 1
        } else {
          roots.push(node)
        }
      })
      
      // Sort by display order, then name
      const sortNodes = (nodes: CategoryNode[]): CategoryNode[] => {
        return nodes.sort((a, b) => {
          if (a.displayOrder !== b.displayOrder) {
            return a.displayOrder - b.displayOrder
          }
          return a.name.localeCompare(b.name)
        }).map(node => ({
          ...node,
          children: sortNodes(node.children)
        }))
      }
      
      return sortNodes(roots)
    }
    
    return buildTree(categories)
  }, [categories])

  // Flatten tree for display (with expanded state)
  const flattenedCategories = useMemo(() => {
    const flatten = (nodes: CategoryNode[], result: CategoryNode[] = []): CategoryNode[] => {
      nodes.forEach(node => {
        result.push(node)
        if (expandedCategories.has(node.id) && node.children.length > 0) {
          flatten(node.children, result)
        }
      })
      return result
    }
    return flatten(categoryTree)
  }, [categoryTree, expandedCategories])

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // Get category path for display
  const getCategoryPath = (category: Category): string => {
    if (!category.parentId) return category.name
    
    const parent = categories.find(c => c.id === category.parentId)
    if (parent) {
      return `${getCategoryPath(parent)} > ${category.name}`
    }
    return category.name
  }

  // Get available parents for dropdown (exclude self and descendants)
  const getAvailableParents = (excludeId?: string): Category[] => {
    return categories.filter(cat => {
      if (excludeId && cat.id === excludeId) return false
      // Simple check - in real scenario, we'd check descendants recursively
      return true
    }).filter(cat => !cat.parentId) // Only show root categories as parents
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parentId: '',
      displayOrder: 0,
    })
    setEditingCategory(null)
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            ➕ Add New Category
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No categories yet. Add your first category!</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
            >
              Add Category
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flattenedCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <span style={{ paddingLeft: `${category.level * 24}px` }}></span>
                        {category.children.length > 0 && (
                          <button
                            onClick={() => toggleExpand(category.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {expandedCategories.has(category.id) ? '▼' : '▶'}
                          </button>
                        )}
                        {category.children.length === 0 && <span className="w-4"></span>}
                        <span>{category.name}</span>
                        {category.children.length > 0 && (
                          <span className="text-xs text-gray-400 ml-2">({category.children.length})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {category.parentId ? (
                        categories.find(c => c.id === category.parentId)?.name || '-'
                      ) : (
                        <span className="text-gray-400">Root</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{category.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-purple-600 hover:text-purple-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-2">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {editingCategory ? 'Update category details' : 'Create a new category or sub-category'}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Type
                  </label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="categoryType"
                        value="root"
                        checked={!formData.parentId}
                        onChange={() => setFormData({ ...formData, parentId: '' })}
                        className="mr-2"
                      />
                      <span className="text-sm">Root Category</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="categoryType"
                        value="sub"
                        checked={!!formData.parentId}
                        onChange={() => {
                          if (!formData.parentId && getAvailableParents(editingCategory?.id).length > 0) {
                            setFormData({ ...formData, parentId: getAvailableParents(editingCategory?.id)[0].id })
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">Sub-Category</span>
                    </label>
                  </div>
                </div>

                {formData.parentId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Category *
                    </label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required={!!formData.parentId}
                    >
                      <option value="">Select parent category...</option>
                      {getAvailableParents(editingCategory?.id).map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the parent category for this sub-category
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.parentId ? 'Sub-Category Name *' : 'Category Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={formData.parentId ? "e.g., Anarkali, Straight, A-Line" : "e.g., Kurtis, Dresses, Sarees"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Add a description for this category..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>

                {!editingCategory && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      <strong>💡 Tip:</strong> {formData.parentId 
                        ? 'Sub-categories help organize products under main categories. Example: "Anarkali" under "Kurtis".'
                        : 'Root categories are main product types. You can add sub-categories later to organize further.'}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm()
                      setShowModal(false)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    {editingCategory ? 'Update' : formData.parentId ? 'Create Sub-Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

