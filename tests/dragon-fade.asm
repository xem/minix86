mov al,0x12
S: int 0x10
push cx			
sub cx,dx		
inc ch
sar cx,1			
rcr al,1
pop di				
add dx,di 
sar dx,1
jc B
xchg cx,dx
neg cx
add cx,0x26b
B: mov ah,0x0C
jmp short S
