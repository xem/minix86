org 100h

S: 
les bx,[si]		; sets ES to the screen, assume si = 0x100
				; 0x101 is SBB AL,9F and changes the char
				; without CR flag, there would be
				; no animation ;)
lahf			; gets 0x02 (green) in the first run
				; afterwards, it is not called again
				; because of alignment ;)
stosw			; print the green char ...
				; (is also 0xAB9F and works as segment)
inc di			; and skip one row
inc di			;
jmp short S+1   ; repeat on 0x101 





