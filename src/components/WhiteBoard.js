import { useState } from 'react'
import { Tldraw } from 'tldraw'
import { useSyncDemo } from '@tldraw/sync'
import 'tldraw/tldraw.css'

export default function WhiteBoard({canvas, setCanvas, roomId}) {
    const store = useSyncDemo({ roomId: roomId })
	return (
		<div style={{ position: 'fixed', height : "100vh", width : "84.5vw", zIndex : 10 , display: canvas, left:'240px'}}>
			<Tldraw store={store} />
		</div>
	)
}