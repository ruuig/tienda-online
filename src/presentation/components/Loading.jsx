import React from 'react'

const Loading = () => {
    return (
        <div className="flex justify-center items-center h-[80vh]">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-secondary-500 border-gray-200"></div>
        </div>
    )
}

export default Loading