; fr-0.1: constant evolution (a tribute to baze)
; ryg/farbrausch 2003
;
; i wish you much fun understanding it. har har.

bits		16
org			100h

start		mov			al, 0x13
				cmc
				inc			dx
				int			0x10
				push		word 0xa000
				pop			es
				
pix			mul			bx
				inc			ax
				add			ax, di
				adc			[si], bx
				div		  word [si+12]

clp			fmul		dword [si]
				fiadd		word [si]
				fistp		word [bx]
				sub			ax, 130
				xchg		ax, [bx]
				xor			cx, ax
				fild		word [bx]
				fmul		st0
				xor			bx, bp
				xchg		ax, dx
				fxch		st1
				jnz			clp
	
				faddp		st1, st0
				fsqrt
				fdivr		dword [si]

				fild		word [bx]
				fild		word [bp]
				fpatan

				salc
				xchg		ax, cx
				or			al, 0x87
				stosb
				jmp			short pix