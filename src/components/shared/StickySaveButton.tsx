import { Button } from '../ui'
import StickyFooter from './StickyFooter'

export type StickySaveButtonProps = {
    buttonTitle: string
    onClick: () => void
    disabled?: boolean
    loading?: boolean
    secondaryButtonTitle?: string | null
    onSecondaryClick?: () => void
    secondaryDisabled?: boolean
    secondaryLoading?: boolean
}

const StickySaveButton = (props: StickySaveButtonProps) => {
    const { buttonTitle, onClick, disabled, loading } = props

    return (
        <StickyFooter
            className="flex items-center justify-between py-4 bg-white dark:bg-gray-800 z-10"
            stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-12"
            defaultClass="min-w-[100%] mx-auto px-4 rounded-xl border border-gray-200 dark:border-gray-600"
        >
            <div className="min-w-[100%] mx-auto">
                <div className="grid grid-cols-[1fr_4fr_0.5fr]">
                    <div></div>
                    <div></div>
                    <div className="flex flex-row gap-2">
                        {props.secondaryButtonTitle && (
                            <div>
                                <Button
                                    onClick={props.onSecondaryClick}
                                    className="w-full bg-secondary text-primary"
                                    loading={props.secondaryLoading}
                                >
                                    {props.secondaryButtonTitle}
                                </Button>
                            </div>
                        )}
                        <Button
                            onClick={onClick}
                            className="w-full bg-primary hover:bg-primary/90 hover:text-white text-white"
                            disabled={disabled}
                            loading={loading}
                        >
                            {buttonTitle}
                        </Button>
                    </div>
                </div>
            </div>
        </StickyFooter>
    )
}

export default StickySaveButton
