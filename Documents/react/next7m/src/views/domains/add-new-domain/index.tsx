'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

export const webTypes = [
  { key: 'selectWebType', label: 'เลือก web type' },
  { key: 'MS', label: 'Money Site' },
  { key: 'NS', label: 'NS' },
  { key: 'PBN', label: 'PBN' }
]

const groups = [
  { key: 'selectGroup', label: 'เลือกทีมรับผิดชอบ' },
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

export default function AddNewDomain() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    url: '',
    webType: '',
    group: '',
    host: '',
    domain: '',
    cloudflare: '',
    status: '',
    active: false,
    vpsDetail: '',
    wpActive: false,
    wp_user: '',
    wp_password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const payload = {
        ...formData,
        status: formData.status.toString()
      }

      const res = await fetch('/api/domains/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        router.push('/domains?success=1')
      } else {
        alert('Failed to add domain')
      }
    } catch (err) {
      console.error(err)
      alert('Error submitting form')
    }
  }

  return (
    <div className='container max-w-lg bg-white shadow rounded p-6 mx-auto'>
      <h1 className='text-2xl font-bold mb-4'>Add New Domain</h1>
      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label className='block mb-2 text-gray-700 font-medium' htmlFor='url'>
            URL:
          </label>
          <input
            id='url'
            name='url'
            value={formData.url}
            onChange={handleChange}
            required
            className='w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>
        <div className='mb-4'>
          <label className='block mb-2 text-gray-700 font-medium' htmlFor='webType'>
            Web Type:
          </label>
          <select
            id='webType'
            name='webType'
            value={formData.webType}
            onChange={handleChange}
            required
            className='w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            {webTypes.map(webType => (
              <option key={webType.key} value={webType.key} disabled={webType.key === 'selectWebType'}>
                {webType.label}
              </option>
            ))}
          </select>
        </div>
        <div className='mb-4'>
          <label className='block mb-2 text-gray-700 font-medium' htmlFor='group'>
            Group:
          </label>
          <select
            id='Group'
            name='Group'
            value={formData.group}
            onChange={handleChange}
            className='w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            {groups.map(group => (
              <option key={group.key} value={group.key} disabled={group.key === 'selectGroup'}>
                {group.label}
              </option>
            ))}
          </select>
        </div>
        <div className='mb-4'>
          <label className='block mb-2 text-gray-700 font-medium' htmlFor='host'>
            Host:
          </label>
          <select
            id='host'
            name='host'
            onChange={handleChange}
            value={formData.host}
            className='w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            {hosts.map(host => (
              <option key={host.key} value={host.key} disabled={host.key === 'selectHost'}>
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
                onChange={handleChange}
                className='w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          )}
        </div>
        <div className='mb-4'>
          <label className='block mb-2 text-gray-700 font-medium' htmlFor='domain'>
            Domain Provider:
          </label>
          <select
            id='domain'
            name='domain'
            value={formData.domain}
            onChange={handleChange}
            required
            className='w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            {domainProviders.map(domainP => (
              <option key={domainP.key} value={domainP.key} disabled={domainP.key === 'selectDomainProvider'}>
                {domainP.label}
              </option>
            ))}
          </select>
        </div>
        <div className='mb-4'>
          <label className='block mb-2 text-gray-700 font-medium' htmlFor='cloudflare'>
            Cloudflare:
          </label>
          <input
            id='cloudflare'
            name='cloudflare'
            value={formData.cloudflare}
            onChange={handleChange}
            required
            className='w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>
        <div className='mb-4'>
          <label className='block mb-2 text-gray-700 font-medium' htmlFor='status'>
            Status:
          </label>
          <select
            id='status'
            name='status'
            value={formData.status}
            onChange={handleChange}
            required
            className='w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            {statusOptions.map(status => (
              <option key={status.key} value={status.key} disabled={status.key === 'selectDomainProvider'}>
                {status.label}
              </option>
            ))}
          </select>
          {/* เช็ค Select URL For 301
              ถ้าค่าของ Host === 'Digital Ocean' ให้แสดง input สำหรับรายละเอียด VPS
              กรอกรายละเอียดของ VPS ด้วย Email ที่ใช้สมัครหรือ Login เข้าไปที่ Digital Ocean */}
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
        <div className='mb-4 flex items-center'>
          <label className='block text-gray-700 font-medium' htmlFor='active'>
            Active:
          </label>
          <input
            type='checkbox'
            id='active'
            name='active'
            checked={formData.active}
            onChange={handleChange}
            className='ml-2'
          />
        </div>
        <div className='mb-4 flex items-center'>
          <label className='block text-gray-700 font-medium' htmlFor='wpActive'>
            WordPress Active:
          </label>
          <input
            type='checkbox'
            id='wpActive'
            name='wpActive'
            checked={formData.wpActive}
            onChange={handleChange}
            className='ml-2'
          />
        </div>

        {formData.wpActive && (
          <>
            <div className='mb-4'>
              <label className='block mb-2 text-gray-700 font-medium' htmlFor='wp_user'>
                WordPress Username:
              </label>
              <input
                id='wp_user'
                name='wp_user'
                value={formData.wp_user}
                onChange={handleChange}
                required
                className='w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div className='mb-4'>
              <label className='block mb-2 text-gray-700 font-medium' htmlFor='wp_password'>
                WordPress Password:
              </label>
              <input
                id='wp_password'
                name='wp_password'
                type='password'
                value={formData.wp_password}
                onChange={handleChange}
                required
                className='w-full border border-gray-300 rounded p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </>
        )}
        <button type='submit' className='bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition mt-4'>
          Add Domain
        </button>
      </form>
    </div>
  )
}
