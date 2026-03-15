import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Calendar, CheckCircle, XCircle, RefreshCcw, Package, ShieldCheck, Phone, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy | Lalitha Garments',
  description: 'Cancellation and Refund Policy for Lalitha Garments',
}

export default function CancellationRefundPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-slate-950 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-slate-100">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">
              Cancellation & Refund Policy
            </h1>
            <div className="w-24 h-1 bg-purple-500 mx-auto rounded-full mb-4"></div>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>Last updated on 15-03-2026 16:11:49</span>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 mb-8 leading-relaxed">
              <strong>SAVANT AAKASH SHIVSHANKARRAO</strong> believes in helping its customers as far as possible, 
              and has therefore a liberal cancellation policy. Under this policy:
            </p>

            {/* Policy Points */}
            <div className="space-y-6">
              {/* Point 1 */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Order Cancellations
                    </h3>
                    <p className="text-slate-700 leading-relaxed">
                      Cancellations will be considered only if the request is made immediately after placing the order. 
                      However, the cancellation request may not be entertained if the orders have been communicated to 
                      the vendors/merchants and they have initiated the process of shipping them.
                    </p>
                  </div>
                </div>
              </div>

              {/* Point 2 */}
              <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Perishable Items
                    </h3>
                    <p className="text-slate-700 leading-relaxed">
                      <strong>SAVANT AAKASH SHIVSHANKARRAO</strong> does not accept cancellation requests for 
                      perishable items like flowers, eatables etc. However, refund/replacement can be made if 
                      the customer establishes that the quality of product delivered is not good.
                    </p>
                  </div>
                </div>
              </div>

              {/* Point 3 */}
              <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Damaged or Defective Items
                    </h3>
                    <p className="text-slate-700 leading-relaxed">
                      In case of receipt of damaged or defective items please report the same to our Customer Service team. 
                      The request will, however, be entertained once the merchant has checked and determined the same at 
                      his own end. This should be reported within <strong className="text-red-600">7 Days</strong> of receipt 
                      of the products.
                    </p>
                    <p className="text-slate-700 leading-relaxed mt-3">
                      In case you feel that the product received is not as shown on the site or as per your expectations, 
                      you must bring it to the notice of our customer service within <strong className="text-red-600">7 Days</strong> of 
                      receiving the product. The Customer Service Team after looking into your complaint will take an 
                      appropriate decision.
                    </p>
                  </div>
                </div>
              </div>

              {/* Point 4 */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Warranty Products
                    </h3>
                    <p className="text-slate-700 leading-relaxed">
                      In case of complaints regarding products that come with a warranty from manufacturers, 
                      please refer the issue to them.
                    </p>
                  </div>
                </div>
              </div>

              {/* Point 5 - Refund Timeline */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <RefreshCcw className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Refund Processing Time
                    </h3>
                    <p className="text-slate-700 leading-relaxed">
                      In case of any Refunds approved by the <strong>SAVANT AAKASH SHIVSHANKARRAO</strong>, 
                      it&apos;ll take <strong className="text-green-600">6-8 Days</strong> for the refund to be 
                      processed to the end customer.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact for Issues */}
            <div className="mt-10 bg-slate-900 rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
              <p className="text-slate-300 mb-4">
                If you have any questions about our cancellation and refund policy, please contact us:
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="tel:9353083597" 
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  9353083597
                </a>
                <a 
                  href="mailto:nirvriksh@gmail.com" 
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  nirvriksh@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-8 py-4 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-6 text-sm text-slate-500">
          <Link href="/contact" className="hover:text-purple-600 transition-colors">
            Contact Us
          </Link>
          <Link href="/cancellation-refund" className="hover:text-purple-600 transition-colors">
            Cancellation & Refund Policy
          </Link>
        </div>
      </div>
    </main>
  )
}
