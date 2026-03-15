import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Building, Calendar, CheckCircle, XCircle, RefreshCcw, Package, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | Lalitha Garments',
  description: 'Contact Lalitha Garments - Get in touch with us for your garment needs',
}

export default function ContactUsPage() {
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
              Contact Us
            </h1>
            <div className="w-24 h-1 bg-purple-500 mx-auto rounded-full"></div>
          </div>

          <div className="space-y-8">
            {/* Last Updated */}
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
              <Calendar className="w-4 h-4" />
              <span>Last updated on 15-03-2026 16:13:58</span>
            </div>

            <p className="text-lg text-slate-700">
              You may contact us using the information below:
            </p>

            {/* Merchant Details */}
            <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
              <div className="flex items-center gap-3 mb-4">
                <Building className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-slate-900">
                  Merchant Legal Entity
                </h2>
              </div>
              <p className="text-slate-700 text-lg font-medium">
                SAVANT AAKASH SHIVSHANKARRAO
              </p>
            </div>

            {/* Addresses */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Registered Address
                  </h3>
                </div>
                <address className="not-italic text-slate-700 leading-relaxed">
                  69/ B-3, Medar Block,<br />
                  1st Main Road, Highway Circle Down,<br />
                  Mandi Mohalla,<br />
                  Karnataka, PIN: 570021
                </address>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-slate-900">
                    Operational Address
                  </h3>
                </div>
                <address className="not-italic text-slate-700 leading-relaxed">
                  69/ B-3, Medar Block,<br />
                  1st Main Road, Highway Circle Down,<br />
                  Mandi Mohalla,<br />
                  Karnataka, PIN: 570021
                </address>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <a 
                href="tel:9353083597"
                className="flex items-center gap-4 bg-green-50 rounded-xl p-6 border border-green-100 hover:bg-green-100 transition-colors"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Telephone No</p>
                  <p className="text-lg font-semibold text-slate-900">9353083597</p>
                </div>
              </a>

              <a 
                href="mailto:nirvriksh@gmail.com"
                className="flex items-center gap-4 bg-blue-50 rounded-xl p-6 border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">E-Mail ID</p>
                  <p className="text-lg font-semibold text-slate-900">nirvriksh@gmail.com</p>
                </div>
              </a>
            </div>

            {/* Cancellation & Refund Policy Section */}
            <div className="border-t border-slate-200 pt-10 mt-10">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4">
                  Cancellation & Refund Policy
                </h2>
                <div className="w-24 h-1 bg-purple-500 mx-auto rounded-full mb-4"></div>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>Last updated on 15-03-2026 16:11:49</span>
                </div>
              </div>

              <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                <strong>SAVANT AAKASH SHIVSHANKARRAO</strong> believes in helping its customers as far as possible, 
                and has therefore a liberal cancellation policy. Under this policy:
              </p>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <p className="text-slate-700">
                      Cancellations will be considered only if the request is made immediately after placing the order. 
                      However, the cancellation request may not be entertained if the orders have been communicated to 
                      the vendors/merchants and they have initiated the process of shipping them.
                    </p>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <p className="text-slate-700">
                      <strong>SAVANT AAKASH SHIVSHANKARRAO</strong> does not accept cancellation requests for 
                      perishable items like flowers, eatables etc. However, refund/replacement can be made if 
                      the customer establishes that the quality of product delivered is not good.
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="text-slate-700">
                      <p className="mb-2">
                        In case of receipt of damaged or defective items please report the same to our Customer Service team. 
                        The request will, however, be entertained once the merchant has checked and determined the same at 
                        his own end. This should be reported within <strong className="text-red-600">7 Days</strong> of receipt 
                        of the products.
                      </p>
                      <p>
                        In case you feel that the product received is not as shown on the site or as per your expectations, 
                        you must bring it to the notice of our customer service within <strong className="text-red-600">7 Days</strong> of 
                        receiving the product. The Customer Service Team after looking into your complaint will take an 
                        appropriate decision.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-slate-700">
                      In case of complaints regarding products that come with a warranty from manufacturers, 
                      please refer the issue to them.
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                  <div className="flex items-start gap-3">
                    <RefreshCcw className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-slate-700">
                      In case of any Refunds approved by the <strong>SAVANT AAKASH SHIVSHANKARRAO</strong>, 
                      it&apos;ll take <strong className="text-green-600">6-8 Days</strong> for the refund to be 
                      processed to the end customer.
                    </p>
                  </div>
                </div>
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
