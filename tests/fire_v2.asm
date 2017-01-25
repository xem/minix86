;           $
;           $$
;          $$$
;      $  $$$$$$$
;      $$$$$$$$$
;   $$ $$$$ $$$$ $$
;    $$$$$$  $$$$$
;   $$$$      $$$$$$$
; $$$$$$$ $$  $$$$$$
;  $$$      $ $$$$$
;  $$$$   $$    $$$
;   $$   $       $$
;    $$  $$$$  $$$
;      $      $$
;
;
; 32b fire effect .v2
;
; v2. without padding
; glitches and border
; ___________________
;
; Mathieu 'p01' Henri
; http://www.p01.org/
; ___________________
;
; january  27th, 2007

org 100h

mov al,13h
int 10h
les ax,[bx]
lds ax,[bx]
dec bh
main:

	xor byte[bx],al
	inc bl

	lodsb
	add al,[si]
	add al,[si-2]
	add al,[si+319]

	shr al,2
	or  al,128
	stosb

jmp main
