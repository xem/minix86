org 100h			; we start at CS:100h
xchg 	bp,ax		; already a trick, puts 09h into AH
mov		dx,text		; DX expects the adress of a $ terminated string
int 	21h			; call the DOS function (AH = 09h)
ret					; quit
text:
db 'Hello World!$'