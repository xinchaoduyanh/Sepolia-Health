'use client'

import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white-50 text-center p-4">
            <h1 className="text-5xl font-bold mb-4 text-black-500">404</h1>
            <img src="https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif" alt="404" />
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Oops! Có vẻ như bạn bị lạc rồi 😅</h2>
            <p className="text-lg text-black-500 mb-6">Trang bạn đang tìm không tồn tại.</p>
            <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition">
                Quay lại trang chủ
            </Link>
        </div>
    )
}
