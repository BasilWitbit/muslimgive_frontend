import React, { FC, useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'

type IProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultSubject?: string
    onSend: (subject: string, body: string) => void
}

const EmailReplyModal: FC<IProps> = ({ open, onOpenChange, defaultSubject = '', onSend }) => {
    const [subject, setSubject] = useState(defaultSubject)
    const [body, setBody] = useState('')

    useEffect(() => {
        if (open) {
            setSubject(defaultSubject)
            setBody('')
        }
    }, [open, defaultSubject])

    const handleSend = () => {
        onSend(subject, body)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-hidden border-[#E8EEF5] p-0 shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:max-w-[560px]">
                <DialogHeader className="relative overflow-hidden border-b border-[#E8EEF5] bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] px-6 py-5 text-left">
                    <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#266DD3]/10 blur-2xl" />
                    <div className="relative">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#266DD3] to-[#3B82E8] text-white shadow-[0_10px_24px_rgba(38,109,211,0.24)]">
                            <Send className="size-5" />
                        </div>
                        <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-[#101928]">
                            Reply to email
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-[#667085]">
                            Compose a clear response and send it back to the charity contact.
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <div className="grid gap-4 px-6 py-5">
                    <div className="grid gap-2">
                        <Label htmlFor="subject" className="text-sm font-semibold text-[#344054]">
                            Subject
                        </Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="h-11 rounded-xl border-[#DDE7F3] bg-[#F8FAFC]"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="body" className="text-sm font-semibold text-[#344054]">
                            Message
                        </Label>
                        <Textarea
                            id="body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="min-h-[160px] rounded-xl border-[#DDE7F3] bg-[#F8FAFC]"
                            rows={7}
                        />
                    </div>
                </div>
                <DialogFooter className="border-t border-[#E8EEF5] bg-[#FBFCFE] px-6 py-4">
                    <Button type="button" variant="outline" className="rounded-xl border-[#DDE7F3]" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        className="rounded-xl bg-gradient-to-r from-[#266DD3] to-[#3B82E8] text-white shadow-[0_10px_24px_rgba(38,109,211,0.24)]"
                        onClick={handleSend}
                    >
                        <Send className="size-4" />
                        Send Reply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default EmailReplyModal
