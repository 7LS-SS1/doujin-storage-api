'use client'

export default function Success() {
  return (
    <div className='flex flex-col justify-center items-center min-h-screen p-6'>
      <h1 className='text-2xl font-semibold text-green-600 mb-4'>🎉 Registration Successful!</h1>
      <p className='text-lg text-gray-700'>Your account has been created successfully.</p>
      <p className='text-lg text-gray-700 mt-2'>
        You can now{' '}
        <a href='/login' className='text-blue-500 underline'>
          login here
        </a>
        .
      </p>
    </div>
  )
}
