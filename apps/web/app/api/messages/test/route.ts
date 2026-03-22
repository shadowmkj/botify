import { MessageService } from '@/lib/messageService'
import { NativeButtonSchema, RawButton } from '@repo/types';
import { NextResponse } from 'next/server'
import z from 'zod';
export async function GET(request: Request) {
    // return NextResponse.json({ status: true })
    const raw_buttons: RawButton[] = [
        // {
        //     name: "quick_reply",
        //     id: 'a',
        //     text: "Reply"
        // },
        // {
        //     name: "cta_call",
        //     buttonParamsJson: {
        //         display_text: "Call me",
        //         phone_number: "+917902708908"
        //     }
        // },
        // {
        //     name: "cta_copy",
        //     buttonParamsJson: {
        //         display_text: "Copy me",
        //         copy_code: "a"
        //     }
        // },
        {
            name: "single_select",
            buttonParamsJson: {
                title: "Test",
                sections: [{
                    title: "Section 1",
                    rows: [{
                        id: "First",
                        title: "First"
                    },
                    {
                        id: "Second",
                        title: "Second"
                    },
                    ]
                }]
            }
        }

    ];
    const buttons = z.array(NativeButtonSchema).parse(raw_buttons);
    const svc = new MessageService("+917902708908", "+917902708908")
    const res = await svc.queueButtonMessage("+918943025837", "Test", "Test", "Test", "test", buttons)
    return NextResponse.json(res)
}
