
;  (м) ( ) м ) ( )   256b intro by baze/3SC for Syndeecate 2001   use NASM to
;  плп лмл ллл ллм   loveC: thanks, Serzh: eat my socks dude ;]   compile the
;  ( ) ( ) ( ) ( )   e-mail: baze@stonline.sk, web: www.3SC.sk    source code

[org 100h]
[segment .text]

SCREEN	equ	160
PIXBUF	equ	204h

	mov	al,13h
	int	10h

	push	word 0A000h
	pop	es
	mov	ax,cs
	add	ah,10h
	mov	fs,ax

	xor	cx,cx
PAL1	mov	dx,3C8h
	mov	ax,cx
	out	dx,al
	inc	dx
	sar	al,1
	js	PAL2
	out	dx,al
	mul	al
	shr	ax,6
	out	dx,al
PAL2	mov	al,0
	out	dx,al
	jns	PAL3
	sub	al,cl
	shr	al,1
	out	dx,al
	shr	al,1
	out	dx,al
PAL3	mov	bx,cx
	mov	[fs:bx],bl
	loop	PAL1

TEX	mov	bx,cx
	add	ax,cx
	rol	ax,cl
	mov	dh,al
	sar	dh,5
	adc	dl,dh
	adc	dl,[fs:bx+255]
	shr	dl,1
	mov	[fs:bx],dl
	not	bh
	mov	[fs:bx],dl
	loop	TEX

	fninit
	fldz

MAIN	add	bh,8
	mov	di,PIXBUF
	fadd	dword [byte di-PIXBUF+TEXUV-4]
	push	di

	mov	dx,-80
TUBEY	mov	bp,-160
TUBEX	mov	si,TEXUV
	fild	word [byte si-TEXUV+EYE]

	mov	[si],bp
	fild	word [si]
	mov	[si],dx
	fild	word [si]

	mov	cl,2
ROTATE	fld	st3
	fsincos
	fld	st2
	fmul	st0,st1
	fld	st4
	fmul	st0,st3
	fsubp	st1,st0
	fxch	st0,st3
	fmulp	st2,st0
	fmulp	st3,st0
	faddp	st2,st0
	fxch	st0,st2
	loop	ROTATE

	fld	st1
	fmul	st0,st0
	fld	st1
	fmul	st0,st0
	faddp	st1,st0
	fsqrt
	fdivp	st3,st0
	fpatan
	fimul	word [si-4]
	fistp	word [si]
	fimul	word [si-4]
	fistp	word [si+1]
	mov	si,[si]

	lea	ax,[bx+si]
	add	al,ah
	and	al,64
	mov	al,-5
	jz	STORE

	shl	si,2
	lea	ax,[bx+si]
	sub	al,ah
	mov	al,-16
	jns	STORE

	shl	si,1
	mov	al,-48
STORE	add	al,[fs:bx+si]
	add	[di],al
	inc	di

	inc	bp
	cmp	bp,160
EYE	equ	$-2
	jnz	TUBEX

	inc	dx
	cmp	dx,byte 80
	jnz	TUBEY

	pop	si
	mov	di,(100-SCREEN/2)*320
	mov	ch,(SCREEN/2)*320/256
	rep	movsw

	mov	ch,SCREEN*320/256
BLUR	dec	si
	sar	byte [si],2
	loop	BLUR

	in	al,60h
	cbw
	dec	ax
	jnz	near MAIN

	mov	al,03h
	int	10h

	db	41,0,0C3h,3Ch
TEXUV	db	"baze"
