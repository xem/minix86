;           $
;           $$
;          $$$
;      $  $$$$$$$
;      $$$$$$$$$
;   $$ $$$$ $$$$ $$
;    $$$$$$  $$$$$
;   $$$$      $$$$$$$
; $$$$$$$     $$$$$$
;  $$$        $$$$$
;  $$$$         $$$
;   $$           $$
;    $$        $$$
;      $      $$
;
; 32bytes fire effect
; Mathieu 'P01' HENRI
; ___________________
; http://www.p01.org
; http://www.256b.com


.model tiny
.code
.386
org 100h

start:
	mov al,13h
	int 10h
	mov bh,0a5h
	mov es,bx
	mov ds,bx
mainLoop:

		xor byte ptr[bx],al
		inc bl

		lodsb
		add al,al
		add al,[si+319]
		add al,[si]
		shr al,2
		or  al,128
		stosb

	jmp mainLoop

	db 3	; lovely padding

end start
