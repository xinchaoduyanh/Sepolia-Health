// Utility functions for appointment status
export const getStatusBadge = (status: string) => {
	const statusConfig: Record<string, { label: string; className: string }> = {
		PENDING: { label: 'Chờ xác nhận', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
		CONFIRMED: { label: 'Đã xác nhận', className: 'bg-blue-100 text-blue-800 border-blue-300' },
		COMPLETED: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800 border-green-300' },
		CANCELLED: { label: 'Đã hủy', className: 'bg-red-100 text-red-800 border-red-300' },
	}
	return statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-300' }
}
