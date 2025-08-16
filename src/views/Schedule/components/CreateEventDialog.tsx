import { Button, Dialog, Input, Switcher } from '@/components/ui'
import type { CreateEventDialog as CreateEventDialogType } from '../types'

const CreateEventDialog = ({
    showModal,
    onCloseModal,
    // selectedRange,
    isEventTypeON,
    setIsEventTypeON,
    eventDescription,
    setEventDescription,
    confirmEventCreation,
}: CreateEventDialogType) => {
    return (
        <Dialog
            bodyOpenClassName="overflow-hidden"
            isOpen={showModal}
            onClose={onCloseModal}
            onRequestClose={onCloseModal}
        >
            <h5 className="mb-4">Create Event:</h5>
            {/* <div className="flex items-center gap-2">
                Selected Range:
                <b>
                    {new Date(selectedRange?.start || '').toLocaleDateString()}
                    {selectedRange?.start !== selectedRange?.end
                        ? ` to ${new Date(selectedRange?.end || '').toLocaleDateString()}`
                        : ''}
                </b>
            </div> */}
            <div className="flex flex-col gap-2 mt-3">
                Reason:
                <Input
                    placeholder="Please write the reason (optional)"
                    textArea
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                />
            </div>
            {/* <div className="flex items-center gap-2 mt-3">
                Event Type:
                <Switcher
                    checked={isEventTypeON}
                    onChange={() => setIsEventTypeON(!isEventTypeON)}
                    checkedContent="On"
                    unCheckedContent="Off"
                />
            </div> */}
            <div className="text-right mt-6">
                <Button
                    className="ltr:mr-2 rtl:ml-2"
                    variant="plain"
                    onClick={onCloseModal}
                >
                    Cancel
                </Button>
                <Button variant="solid" onClick={confirmEventCreation}>
                    Submit
                </Button>
            </div>
        </Dialog>
    )
}

export default CreateEventDialog
