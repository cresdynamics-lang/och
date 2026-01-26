'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import CertificatesClient from './certificates-client'

export default function CertificatesPage() {
  return (
    <RouteGuard>
      <CertificatesClient />
    </RouteGuard>
  )
}












