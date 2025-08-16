import { Card, Progress } from '@/components/ui'
import classNames from '@/utils/classNames'
import { type ReactNode } from 'react'

interface SummaryItem {
    label: string
    value: string | number
}

export type SummarySegmentProps = {
    title: string
    value: string | number | ReactNode
    icon: ReactNode
    iconClass: string
    className?: string
    items?: SummaryItem[]
    variant?: 'default' | 'detailed' | 'gradient' | 'minimal'
    maxValue?: string | number | ReactNode
}

export const SummarySegment = ({
    title,
    value,
    icon,
    iconClass,
    className,
    items = [],
    variant = 'default',
    maxValue,
}: SummarySegmentProps) => {
    const percentage = Math.round((Number(value) / Number(maxValue)) * 100)

    const getVariantStyles = () => {
        switch (variant) {
            case 'gradient':
                return 'bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900'
            case 'minimal':
                return 'bg-white dark:bg-gray-800'
            default:
                return 'bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900'
        }
    }
    if (variant === 'detailed') {
        return (
            <div
                className={classNames(
                    'group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg',
                    className,
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative flex h-full items-center p-6">
                    <div className="flex items-center gap-4">
                        <div
                            className={classNames(
                                'flex items-center justify-center w-16 h-16 rounded-xl text-2xl transition-transform duration-300 group-hover:scale-110 shadow-md',
                                iconClass,
                            )}
                        >
                            {icon}
                        </div>

                        <div className="flex-1">
                            <h3 className="text-xs font-[600] text-gray-500 uppercase dark:text-gray-300 mb-2">
                                {title}
                            </h3>
                            <div className="">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                        {value}
                                    </span>
                                    <span className="text-lg font-medium text-gray-400 dark:text-gray-500">
                                        / {maxValue}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className={classNames(
                'group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg',
                className,
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative p-6">
                <div className="flex items-start gap-4">
                    <div
                        className={classNames(
                            'flex items-center justify-center w-14 h-14 rounded-xl text-2xl transition-transform duration-300 group-hover:scale-110 shadow-md',
                            iconClass,
                        )}
                    >
                        {icon}
                    </div>

                    <div className="flex-1">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {value}
                        </div>
                        <h3 className="text-xs font-[600] text-gray-500 uppercase dark:text-gray-300 mt-1">
                            {title}
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    )
}
