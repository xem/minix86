org 100h			; we start at CS:100h
mov al,0x13
int 0x10
push 0xa000
pop es
X: cwd			; "clear" DX (if AH < 0x7F)
mov ax,di		; get screen position into AX
mov bx,320		; get screen width into BX
div bx			; divide, to get row and column
xor ax,dx		; the famous XOR pattern
and al,32+8		; a more interesting variation of it
stosb			; finally, draw to the screen
jmp short X		; rinse and repeat