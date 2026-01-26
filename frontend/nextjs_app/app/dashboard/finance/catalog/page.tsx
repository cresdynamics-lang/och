/**
 * Product and Price Management (Catalog) Page
 * Finance users manage the commercial structure of programs
 */

'use client'

import { useState } from 'react'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { FinanceNavigation } from '@/components/navigation/FinanceNavigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  ShoppingCart, 
  DollarSign, 
  Globe, 
  Users,
  Plus,
  Edit,
  Trash2,
  FileText,
  Percent,
  MapPin
} from 'lucide-react'

type TabType = 'products' | 'price-books' | 'tax-config' | 'seat-caps'

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<TabType>('products')
  return (
    <RouteGuard>
      <div className="min-h-screen bg-och-midnight flex">
        <FinanceNavigation />
        <div className="flex-1 lg:ml-64">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-h1 font-bold text-white">Product & Price Management</h1>
              <p className="mt-1 body-m text-och-steel">
                Manage products, price books, tax configuration, and seat caps
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-och-steel/20 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s ${
                    activeTab === 'products'
                      ? 'border-och-defender text-och-mint'
                      : 'border-transparent text-och-steel hover:text-white hover:border-och-steel/30'
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setActiveTab('price-books')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s ${
                    activeTab === 'price-books'
                      ? 'border-och-defender text-och-mint'
                      : 'border-transparent text-och-steel hover:text-white hover:border-och-steel/30'
                  }`}
                >
                  Price Books
                </button>
                <button
                  onClick={() => setActiveTab('tax-config')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s ${
                    activeTab === 'tax-config'
                      ? 'border-och-defender text-och-mint'
                      : 'border-transparent text-och-steel hover:text-white hover:border-och-steel/30'
                  }`}
                >
                  Tax Configuration
                </button>
                <button
                  onClick={() => setActiveTab('seat-caps')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium body-s ${
                    activeTab === 'seat-caps'
                      ? 'border-och-defender text-och-mint'
                      : 'border-transparent text-och-steel hover:text-white hover:border-och-steel/30'
                  }`}
                >
                  Seat Caps
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Products Tab */}
              {activeTab === 'products' && (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-h2 font-semibold text-white">Products</h2>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Product
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Product Types */}
                    <Card className="p-6 bg-och-midnight border border-och-steel/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-h3 font-semibold text-white">One-Time Seats</h3>
                        <Badge variant="outline">0 products</Badge>
                      </div>
                      <p className="body-m text-och-steel mb-4">
                        Single purchase seats for programs
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Manage
                      </Button>
                    </Card>

                    <Card className="p-6 bg-och-midnight border border-och-steel/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-h3 font-semibold text-white">Subscriptions</h3>
                        <Badge variant="outline">0 products</Badge>
                      </div>
                      <p className="body-m text-och-steel mb-4">
                        Recurring subscription plans
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Manage
                      </Button>
                    </Card>

                    <Card className="p-6 bg-och-midnight border border-och-steel/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-h3 font-semibold text-white">Installment Bundles</h3>
                        <Badge variant="outline">0 products</Badge>
                      </div>
                      <p className="body-m text-och-steel mb-4">
                        Multi-payment installment plans
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Manage
                      </Button>
                    </Card>

                    <Card className="p-6 bg-och-midnight border border-och-steel/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-h3 font-semibold text-white">Add-ons</h3>
                        <Badge variant="outline">0 products</Badge>
                      </div>
                      <p className="body-m text-och-steel mb-4">
                        Additional products and services
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Manage
                      </Button>
                    </Card>
                  </div>
                </>
              )}

              {/* Price Books Tab */}
              {activeTab === 'price-books' && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-h2 font-semibold text-white">Price Books</h2>
                      <p className="body-m text-och-steel mt-1">
                        Manage versioned price books by currency (BWP, USD, ZAR, KES) and channel-specific pricing
                      </p>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Price Book
                    </Button>
                  </div>

                  {/* Price Book List */}
                  <Card className="p-6 bg-och-midnight border border-och-steel/20">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-och-steel/20">
                        <thead className="bg-och-midnight/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Currency
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Version
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Channel
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-och-steel">
                              <Globe className="h-12 w-12 mx-auto mb-2 text-och-steel" />
                              <p className="body-m">No price books configured</p>
                              <p className="body-s text-och-steel/70 mt-2">Create your first price book to get started</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Currency Quick Add */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    {['BWP', 'USD', 'ZAR', 'KES'].map((currency) => (
                      <Card key={currency} className="p-4 bg-och-midnight border border-och-steel/20 hover:border-och-defender/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-och-defender" />
                            <div>
                              <p className="font-medium text-white">{currency}</p>
                              <p className="body-s text-och-steel">No price book</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* Tax Configuration Tab */}
              {activeTab === 'tax-config' && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-h2 font-semibold text-white">Tax Configuration</h2>
                      <p className="body-m text-och-steel mt-1">
                        Define and manage regional tax rules and jurisdictional rates (e.g., Botswana DPA or regional VAT)
                      </p>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tax Rule
                    </Button>
                  </div>

                  {/* Tax Rules List */}
                  <Card className="p-6 bg-och-midnight border border-och-steel/20">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-och-steel/20">
                        <thead className="bg-och-midnight/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Region/Country
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Tax Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Rate
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Effective Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-och-steel">
                              <Percent className="h-12 w-12 mx-auto mb-2 text-och-steel" />
                              <p className="body-m">No tax rules configured</p>
                              <p className="body-s text-och-steel/70 mt-2">Add tax rules for different regions and jurisdictions</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Quick Add Common Regions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    {[
                      { region: 'Botswana', tax: 'VAT', rate: '14%' },
                      { region: 'South Africa', tax: 'VAT', rate: '15%' },
                      { region: 'Kenya', tax: 'VAT', rate: '16%' },
                    ].map((item) => (
                      <Card key={item.region} className="p-4 bg-och-midnight border border-och-steel/20 hover:border-och-orange/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-och-orange" />
                            <div>
                              <p className="font-medium text-white">{item.region}</p>
                              <p className="body-s text-och-steel">{item.tax}: {item.rate}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* Seat Caps Tab */}
              {activeTab === 'seat-caps' && (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-h2 font-semibold text-white">Seat Cap Oversight</h2>
                      <p className="body-m text-och-steel mt-1">
                        Set and monitor seat caps for various cohorts and tracks
                      </p>
                    </div>
                    <Button>
                      <Users className="h-4 w-4 mr-2" />
                      Manage Caps
                    </Button>
                  </div>

                  {/* Seat Caps Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card className="p-6 bg-och-midnight border border-och-steel/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="body-s font-medium text-och-steel">Total Capacity</p>
                          <p className="text-2xl font-bold text-white mt-1">0</p>
                        </div>
                        <Users className="h-8 w-8 text-och-defender" />
                      </div>
                    </Card>
                    <Card className="p-6 bg-och-midnight border border-och-steel/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="body-s font-medium text-och-steel">Seats Used</p>
                          <p className="text-2xl font-bold text-white mt-1">0</p>
                        </div>
                        <Users className="h-8 w-8 text-och-mint" />
                      </div>
                    </Card>
                    <Card className="p-6 bg-och-midnight border border-och-steel/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="body-s font-medium text-och-steel">Available</p>
                          <p className="text-2xl font-bold text-white mt-1">0</p>
                        </div>
                        <Users className="h-8 w-8 text-och-gold" />
                      </div>
                    </Card>
                  </div>

                  {/* Seat Caps List */}
                  <Card className="p-6 bg-och-midnight border border-och-steel/20">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-och-steel/20">
                        <thead className="bg-och-midnight/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Cohort/Track
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Program
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Cap
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Used
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Available
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-och-steel uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-och-midnight divide-y divide-och-steel/20">
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-och-steel">
                              <Users className="h-12 w-12 mx-auto mb-2 text-och-steel" />
                              <p className="body-m">No seat caps configured</p>
                              <p className="body-s text-och-steel/70 mt-2">Set seat caps for cohorts and tracks to manage enrollment limits</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  )
}

