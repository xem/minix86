org 100h	; code starts at 0x100
mov al,0x12	; assume ah = 0 ; set graphics mode to 640*480
inc bx		; assume bx = 0 ; set to 1 (show cursor)
mloop:	
int 0x10	; first loop, switch to graphic mode
		; further loops, set pixel		
xchg bx,ax	; first loop, set AX to 1 (show cursor)
		; further loops, restore old calling mode		
xor al,0x02	; switch modes : show cursor <-> get mouse state
		; updating XY every second loop plus drawing
		; one pixel left results in thicker lines		
int 0x33	; call the mouse interrupt
xchg bx,ax	; store the button state in AL for drawing
		; remember the current calling mode
		; for switching it later (in BX)			
mov ah,0x0C	; set mode to "set pixel"
loop mloop	; dec CX -> draw one pixel left from cursor
		; basically enables drawing pixels
		; while the cursor is active
		; allows exit if the mouse is leftmost
ret		; assume [[FFEE]] = [0] = CD20 = int 20
