org 100h						; we start at CS:100h
push 	0xa000 - 10 - 3 * 20	; video base - 3.5 lines
or 		al, 0x13				; mode 13h = 320 x 200 in 256 colors
pop 	es						; get aligned video memory base
int 	0x10					; switch videomode
X: 
sub		dh, [si]				; vertical alignment
pusha							; push all registers on stack
fild 	word	[bx-9]			; fpustack :  x
fild 	word	[bx-8]			; fpustack :  y  x
fpatan							; fpustack :  arc
fst 	st1						; fpustack :  arc  arc
fcos							; fpustack :  cos(arc)  arc
fimul	dword	[si]			; fpustack :  l*cos(arc)  arc
fidiv	word	[bx-8]			; fpustack :  l*cos(arc)/x  arc
fiadd	word	[bp+si]			; fpustack :  l*cos(arc)/x+offset  arc
fistp	dword	[bx-7]			; fpustack :  arc
fimul	word	[byte si+val]	; fpustack :  scaled_arc
fistp	word	[bx-5]			; fpustack :  -
popa							; pop all registers from stack
xor 	al, cl					; XOR scaled_arc with distance
and 	al, 16 + 8 + 2			; sub selecting palette part
stosb							; writing to screen
mov 	ax, 0xCCCD				; Performing the famous
mul 	di						; Rrrola trick
jo 		X						; next frame check
add 	word [bp+si], byte 23	; change offset smoothly
in 		al, 0x60				; check for ...
dec 	ax						; ...ESC key
jnz 	X						; otherwise continue
ret								; quit program
val:	dw 6519 				; n = 160 * 256 / pi / 2 ; 0x1977