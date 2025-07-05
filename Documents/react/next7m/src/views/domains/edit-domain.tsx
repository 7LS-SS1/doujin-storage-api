'use client'

import { Fragment, useState, useEffect } from 'react'

import { Dialog, Transition } from '@headlessui/react'

import type { DomainType } from '@/types/domain'

type Props = {
  isOpen: boolean
  onClose: () => void
  domain: DomainType | null
  onSave: (domain: DomainType) => void
}

export const webTypes = [
  { key: 'selectWebType', label: 'เลือก web type' },
  { key: 'MS', label: 'Money Site' },
  { key: 'NS', label: 'NS' },
  { key: 'PBN', label: 'PBN' }
]

const groups = [
  { key: '7M', label: '7M' },
  { key: 'Center X', label: 'Center X' },
  { key: 'RCA', label: 'RCA' }
]

const hosts = [
  { key: 'selectHost', label: 'เลือก Host' },
  { key: 'AWS', label: 'AWS' },
  { key: 'AWS-Lightsail', label: 'LightSail' },
  { key: 'WPX', label: 'WPX' },
  { key: 'Digital Ocean', label: 'Digital Ocean' },
  { key: 'Hostinger', label: 'Hostinger' },
  { key: 'Vultr', label: 'Vultr' },
  { key: 'Godaddy', label: 'Godaddy' },
  { key: 'Other', label: 'อื่นๆ' }
]

const domainProviders = [
  { key: 'selectDomainProvider', label: 'เลือก Domain Provider' },
  { key: 'Namecheap', label: 'Namecheap' },
  { key: 'Godaddy', label: 'Godaddy' },
  { key: 'Google Domains', label: 'Google Domains' },
  { key: 'Other', label: 'อื่นๆ' }
]

const statusOptions = [
  { key: 'selectStatus', label: 'เลือกสถานะ' },
  { key: 'active', label: 'ใช้งาน' },
  { key: 'inactive', label: 'ยังไม่ใช้งาน' },
  { key: 'pending', label: 'กำลังดำเนินการ' },
  { key: 'suspended', label: 'ถูกระงับ' },
  { key: 'expired', label: 'หมดอายุ' },
  { key: '301', label: '301' }
]

export default function EditDomainModal({ isOpen, onClose, domain, onSave }: Props) {
  const [formData, setFormData] = useState<DomainType | null>(null)

  useEffect(() => {
    if (isOpen && domain) {
      setFormData({
        id: domain.id,
        url: domain.url || '',
        webType: domain.webType || '',
        group: domain.group || '',
        host: domain.host || '',
        domain: domain.domain || '',
        cloudflare: domain.cloudflare || '',
        status: domain.status || '',
        active: domain.active ?? false,
        wpActive: domain.wpActive ?? false,
        wp_user: domain.wp_user || '',
        wp_password: domain.wp_password || '',
        vpsDetail: domain.vpsDetail || ''
      })
    } else if (isOpen && !domain) {
      setFormData({
        id: 0,
        url: '',
        webType: '',
        group: '',
        host: '',
        domain: '',
        cloudflare: '',
        status: '',
        active: false,
        wpActive: false,
        wp_user: '',
        wp_password: '',
        vpsDetail: ''
      })
    }
  }, [domain, isOpen])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    console.log('formData', formData)
    if (!formData) return
    const { name, value, type, checked } = e.target

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <div className='fixed inset-0 bg-black/30' aria-hidden='true' />

        <div className='fixed inset-0 flex items-center justify-center p-4'>
          <Dialog.Panel className='w-full max-w-md rounded bg-white p-6'>
            <Dialog.Title className='text-lg font-bold mb-4'>Edit Domain</Dialog.Title>

            {formData ? (
              <form className='space-y-4'>
                <div className='flex flex-col gap-2'>
                  <label className='block text-sm font-medium mb-1'>Domain URL</label>
                  <input
                    className='w-full p-2 border rounded'
                    value={formData.url}
                    placeholder='Enter domain URL'
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
                <div className='flex flex-col gap-2'>
                  <label className='block text-sm font-medium mb-1'>Type</label>
                  <select
                    className='w-full p-2 border rounded'
                    value={formData.webType}
                    onChange={e => setFormData({ ...formData, webType: e.target.value })}
                  >
                    {webTypes.map(webType => (
                      <option key={webType.key} value={webType.key}>
                        {webType.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='block text-sm font-medium mb-1'>Group</label>
                  <select
                    className='w-full p-2 border rounded'
                    value={formData.group}
                    onChange={e => setFormData({ ...formData, group: e.target.value })}
                  >
                    <option value='' disabled>
                      -- กรุณาเลือกทีม --
                    </option>
                    {groups.map(group => (
                      <option key={group.key} value={group.key}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='block text-sm font-medium mb-1'>Host</label>
                  <select
                    className='w-full p-2 border rounded'
                    value={formData.host}
                    onChange={e => setFormData({ ...formData, host: e.target.value })}
                  >
                    {hosts.map(host => (
                      <option key={host.key} value={host.key}>
                        {host.label}
                      </option>
                    ))}
                  </select>
                  {/* เช็ค Select Hoat
                      ถ้าค่าของ Host === 'Digital Ocean' ให้แสดง input สำหรับรายละเอียด VPS
                      กรอกรายละเอียดของ VPS ด้วย Email ที่ใช้สมัครหรือ Login เข้าไปที่ Digital Ocean */}
                  {formData.host === 'Digital Ocean' && (
                    <div className='mb-4'>
                      <label className='block mb-2 text-gray-700 font-medium' htmlFor='vpsDetail'>
                        VPS Detail:
                      </label>
                      <input
                        type='email'
                        id='vpsDetail'
                        name='vpsDetail'
                        value={formData.vpsDetail}
                        onChange={e => setFormData({ ...formData, vpsDetail: e.target.value })}
                        className='w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  )}
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='block text-sm font-medium mb-1'>Domain Provider</label>
                  <select
                    className='w-full p-2 border rounded'
                    value={formData.domain}
                    onChange={e => setFormData({ ...formData, domain: e.target.value })}
                  >
                    {domainProviders.map(domainProvider => (
                      <option key={domainProvider.key} value={domainProvider.key}>
                        {domainProvider.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='block text-sm font-medium mb-1'>Cloudflare</label>
                  <input
                    className='w-full p-2 border rounded'
                    value={formData.cloudflare}
                    placeholder='Enter Cloudflare Email'
                    type='email'
                    onChange={e => setFormData({ ...formData, cloudflare: e.target.value })}
                  />
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='block text-sm font-medium mb-1'>Status</label>
                  <select
                    className='w-full p-2 border rounded'
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    {statusOptions.map(statusOption => (
                      <option key={statusOption.key} value={statusOption.key}>
                        {statusOption.label}
                      </option>
                    ))}
                  </select>
                  {/* เช็ค Select Status
                    ถ้าค่าของ Status === '301' ให้แสดง input สำหรับ URL ที่จะ Redirect
                    กรอก URL ที่ต้องการ Redirect ไปยัง URL ใหม่ */}
                  {formData.status === '301' && (
                    <div className='mb-4'>
                      <label className='block mb-2 text-gray-700 font-medium' htmlFor='vpsDetail'>
                        Redirect to :
                      </label>
                      <input
                        type='text'
                        id='301Redirect'
                        name='301Redirect'
                        placeholder='Enter URL to redirect'
                        className='w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  )}
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='block text-sm font-medium mb-1'>WP Install</label>

                  <label className='flex gap-2 items-center'>
                    <input
                      type='checkbox'
                      checked={formData.wpActive}
                      onChange={e => setFormData({ ...formData, wpActive: e.target.checked })}
                    />
                    ติดตั้งแล้ว
                  </label>
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='block text-sm font-medium mb-1'>WP User</label>
                  <input
                    className='w-full p-2 border rounded'
                    value={formData.wp_user}
                    placeholder='Enter WP User'
                    onChange={e => setFormData({ ...formData, wp_user: e.target.value })}
                  />
                </div>

                <div className='flex flex-col gap-2'>
                  <label className='block text-sm font-medium mb-1'>WP Password</label>
                  <input
                    type='password'
                    className='w-full p-2 border rounded'
                    value={formData.wp_password}
                    placeholder='Enter WP Password'
                    onChange={e => setFormData({ ...formData, wp_password: e.target.value })}
                  />
                </div>
              </form>
            ) : (
              <div>Loading...</div>
            )}

            <div className='flex justify-end gap-2 mt-4'>
              <button className='bg-gray-300 px-4 py-2 rounded' onClick={onClose}>
                Cancel
              </button>
              <button
                className='bg-blue-600 text-white px-4 py-2 rounded'
                disabled={!formData}
                onClick={() => {
                  if (formData) {
                    console.log('formData before save', formData)
                    onSave(formData)
                  }
                }}
              >
                Save
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  )
}
