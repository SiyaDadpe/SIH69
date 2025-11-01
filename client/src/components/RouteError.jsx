import React from 'react'
import { useRouteError } from 'react-router-dom'

export default function RouteError() {
  const error = useRouteError()
  console.error(error)

  const message = error?.statusText || error?.message || 'Something went wrong'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] p-6">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.75 6a.75.75 0 00-1.5 0v5a.75.75 0 001.5 0V8.25zM12 16.5a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Unexpected Application Error</h1>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex gap-2 justify-center">
          <button className="px-4 py-2 text-white bg-[#BA7967] rounded-md" onClick={() => window.location.reload()}>Reload</button>
          <button className="px-4 py-2 text-[#BA7967] border border-[#BA7967] rounded-md" onClick={() => window.history.back()}>Go Back</button>
        </div>
      </div>
    </div>
  )
}
