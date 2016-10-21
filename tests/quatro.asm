;quatro // introrama
;hellmood^DESIRE & sensenstahl
;http://www.pouet.net/user.php?who=97586
;www.sensenstahl.com
;compile with nasm

org 100h
start:								; label to create BYTE offsets into code
			push 0xA000				; Start of VGA video memory
			pop es					; into ES
			xor bp,bp				; BP adressing, uses SS, frees DS, no extra segment needed
			mov al,0x13				; mode 13h, 320x200 in 256 colors
			mov dh,0x80				; high byte of offscreen memory, low byte not important
			mov ds,dx				; no palette influence (later) when DH = 0x80
			inc cx					; align color components / color number / color count
palette_loop:
			int 0x10				; shared int 10h ! (palette entry , set mode)
			sub ch,2				; adjust green value
			sub dh,4				; adjust red value
			dec bx					; next color
			mov ax,0x1010				; sub function to change palette
			loop palette_loop			; adjust blue value & loop
main_loop:
			xor dx,dx				; create X Y from screen pointer
			mov cx,320				; also implicit  "MOV CH,1"
			mov ax,di				; get screenpointer
			div cx					; X Y in AX DX
			imul si,bx,byte 3		; border offset from timer
			add ax,bx				; effect offset from timer

			cmp dx,byte 28			; a lonely line ...
			je line
			cmp dx,byte 4			; make left border
			jle line
			cmp dx,byte 25			; another lonely line ... now friends =)
			je line
			cmp dx,317				; make right border
			jae line
			cmp dx,byte 33+1		; left outside
			jl outside
			cmp dx,287-1			; right outside
			jle further				; we're in the effect area, go further
outside:
			add ax,si				; add our border offset (see above)
			add dl,8				; Offset to force "and" symmetry
			and al,dl				; "and" pattern (boxes)
			shr al,1				; this and next can be optimized to "and al,16"
			and al,8				; black on outside strip...
			jz short skip			; ...means plot black pixel (skip)
line:
			mov al,62				; white on strip holes ;not clean white
			jmp short skip			; because only whitey ford sings the blues
further:
			test al,64+32+16+8		; check if between effect windows
			jnz next				; if not : skip the skip ;)
			salc					; go black
			jmp short skip			; and plot black pixel
next:
			shrd si,ax,23			; set value for fpu program decision
			xor ah,ah				; delete high byte from time influence (important!)
			sub ax,byte 100			; center around middle
			sub dx,byte 127;160 	; or, don't, because symmetry is boring ;)
			and si,byte 3			; bring down program number to 0-3
		pusha						; t <- BX, x <- AX , y <- DX
			fninit
			fild word [bp-10] 		; t		make big slow sine of t
			fidiv word [bp+3]		; t'	use value from PSP (~0x009F)
			fsin					; t''
			fimul word [bp+3]		; t'''  use value from PSP (~0x009F)
			fild word [bp-4]		; x t
			fild word [bp-8]		; y x t

			mov cl,[bp+si+offsetlist_fpu_parts]
			call cx					; call FPU part routine

			fistp word [bp-4]		; result -> AX
		popa

			mov cl,[bp+si+offsetlist_aftereffect]
			call cx					; call after effect routine
			
			test al,16				; wrap colors
			jnz skipwrap			; each 16 entries
			xor al,31				; to produce smooth
skipwrap:			
			aam 16					; color gradients

			shl si,4				; offset into color palette
			add ax,si				; according to effect number
skip:
			mov [di],al				; plot value into offscreen
			inc di					; next pixel
			jnz main_loop			; repeat until all pixels done

			inc bx					; increment animation variable
			mov dx,0x3DA			; port number for checking retrace
vsync:  	
			in al, dx				; wait
			and al, 8				; for
			jz vsync				; retrace

			mov si,di				; align offscreen and video memory
copy_pixels:
			movsw					; double two pixels at once
			test di,di				; check if done
			jnz copy_pixels			; repeat until done

			in al,0x60				; read keyboard
			dec al					; check for 
			jnz main_loop			; ESCape, repeat if not
ae_part4:
			xor al,dl				; the famous XOR pattern
			add ax,bx				; offset by time
			sub ax,di				; blurred by screenpointer
			shr ax,1				; and slowed down
ae_part1:
ae_part3:
			ret						; shared RET for all FX and program exit
val1:
			dw -102					; Value to scale [-pi,pi] to color palette
offsetlist_fpu_parts:				; byte offsets for FPU parts
			db fpu_part1-start,fpu_part2-start,fpu_part3-start,fpu_part4-start
offsetlist_aftereffect:				; byte offsets for after effects
			db ae_part1-start,ae_part2-start,ae_part3-start,ae_part4-start
fpu_part1:							; x y t
			fadd st0,st2			; xo y t
			fmul st0				; xo² y t
			fxch st0,st1			; y xo² t
			fmul st0				; y² xo² t
			faddp					; R² t
			fsqrt					; R t
			fidivr word [bp]		; R'
			faddp					; R + t
fpu_part2:							; x y t
			ret
fpu_part3:							; x y t
			fadd st0,st1
			fpatan					; a t
			fimul word [bp+val1]	; a' t
			faddp					; a'+t
			ret
fpu_part4:  						; x y t
			fxch st0,st1			; y x 
			ret
ae_part2:
			push di					; save screen pointer
			shl di,2				; apply the...
			mul byte[di]			; ...inceptional...
			pop di					; restore screen pointer
			mov al,ah				; ...sensenstyle
			ret						; and return
troll_section:
			db 'NOP'				; that was exhausting, now chill! =)