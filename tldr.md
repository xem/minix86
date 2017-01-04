# x86 decompilation & emulation: TL;DR

## Introduction

This document explains how to decompile x86 binary into assembly language and how to emulate it in another language.
<br>
It's meant to be as short and clear as possible, and to document the tiny x86 JS emulator https://xem.github.io/minix86.
<br>
We'll focus on MS-DOS-like x86 (32-bit), .COM files, Intel's Assembly syntax and JavaScript emulation, but it can easily adapt to different systems.
<br>
Registers, prefixes and instructions specific to 8-bit and 64-bit architectures are ignored.
<br>
COM files can be compiled for 16-bit or 32-bit processors, so we'll support both.
<br>
Segments are ignored for now as they aren't used in COM files.
<br>
VEX and EVEX instructions are ignored too (for now).

## Sources

Here are all the sources used to write this guide:

- [Intel's x86 and 64 manuals](http://www.intel.eu/content/www/eu/en/processors/architectures-software-developer-manuals.html) (especially vol. 2)
- [x86 opcode and instruction reference](http://ref.x86asm.net/index.html) by [MazeGen](http://ref.x86asm.net/#License) (especially [coder32](http://ref.x86asm.net/coder32.html))
- [Sandpile](http://www.sandpile.org/)
- [x86 Opcode Structure and Instruction Overview](https://net.cs.uni-bonn.de/fileadmin/user_upload/plohmann/x86_opcode_structure_and_instruction_overview.pdf)
- [Mode 13h and default color palette](https://en.wikipedia.org/wiki/Mode_13h)
- [x86/x64 Machine Code](https://github.com/gdabah/distorm/wiki/x86x64MachineCode)
- [Tiny x86 prods wiki](http://www.sizecoding.org)
- [How to write a disassembler](http://stackoverflow.com/questions/924303/how-to-write-a-disassembler/924445#924445)
- [Intel vs AT&T syntax](http://www.imada.sdu.dk/Courses/DM18/Litteratur/IntelnATT.htm)
- [Table of x86 registers](https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Table_of_x86_Registers_svg.svg/1280px-Table_of_x86_Registers_svg.svg.png)
- [FLAGS register](https://en.wikipedia.org/wiki/FLAGS_register)
- [A Magnetized Needle and a Steady Hand](http://nullprogram.com/blog/2016/11/17/)
- [x86 oddities](https://code.google.com/archive/p/corkami/wikis/x86oddities.wiki) + [Corkami Standard Test](https://github.com/gunmetalbackupgooglecode/corkami/wiki/Standard-Test) + [download](https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/corkami/CoST-20110816.zip)
- [x86 disassembly](https://en.wikibooks.org/wiki/X86_Disassembly)
- [x86 on wikipedia](https://en.wikipedia.org/wiki/X86)

## Terminology / notations / standards

### Hardware:

- 80x86 and x86 refer to both the 16-bit and 32-bit microprocessors and instruction set architecture developed by Intel.
- Intel 8086 is the name of the first 16-bit microprocessor.
- Intel 80386 is the name of the first 32-bit microprocessor.
- IA-32 and i386+ refer only to the 32-bit architecture.
- IA-64, Intel 64, Itanium and x86-64 refer to the 64-bit architecture (ignored here).
- x86 processors use little-endianness for multi-byte numbers (ex: ````0xA0B70708```` is stored as: ````08 07 B7 A0````).
- The decoding mode depends on the processor and the instructions prefixes used) and defines the size of the registers and addresses (16, 32 or 64 bits).

### .COM files
- 64kb max, no segmentation (code and data are together in the same place).
- Loaded at memory address 0x100.
- No header (contains directly the first binary instruction, as if it was at the address 0x100).

### Assembly:

- ASM files (that compile into .COM files) start with the statement ````org 100h```` (the entry point address).
- ````label: mnemonic argument1, argument2, argument3```` (ex: ````LOADREG: MOV EAX, SUBTOTAL````).
- Hex numbers: ````89ABh````.
- Binary numbers:  ````1010b````.
- Segmented addressing: ````Segment-register:Byte-address```` (ex: ````DS:FF79H```` or ````CS:EIP````).
- ````rCX```` is a general-purpose register which can be one of the following: CX (16 bits), ECX (32 bits) or RCX (64 bits).

### Important Registers:

````
+---+------------+----------------+-----------------+------------------------------+
| # | r8 / 8-bit | r16 / 16-bit   | r32 / 32-bit    | Name                         |
+---+------------+----------------+-----------------+------------------------------+
| 0 | AL         | AX (AL + AH)   | EAX             | Accumulator Register         |
| 1 | CL         | CX (CL + CH)   | ECX             | Counter Accumulator Register |
| 2 | DL         | DX (DL + DH)   | EDX             | Data Accumulator Register    |
| 3 | BL         | BX (BL + BH)   | EBX             | Base Accumulator Register    |
| 4 | AH         | SP (SPL)       | ESP             | Stack Pointer                |
| 5 | CH         | BP (BPL)       | EBP             | Base Pointer                 |
| 6 | DH         | SI (SIL)       | ESI             | Source Index                 |
| 7 | BH         | DI (DIL)       | EDI             | Destination Index            |
+---+------------+----------------+-----------------+------------------------------+
| 8 | R8B        | R8W (R8B)      | R8D (R8W)       | General purpose registers    |
| 9 | R9B        | R9W (R8B)      | R9D (R8W)       |                              |
| A | R10B       | R10W (R8B)     | R10D (R8W)      |                              |
| B | R11B       | R11W (R8B)     | R11D (R8W)      |                              |
| C | R12B       | R12W (R8B)     | R12D (R8W)      |                              |
| D | R13B       | R13W (R8B)     | R13D (R8W)      |                              |
| E | R14B       | R14W (R8B)     | R14D (R8W)      |                              |
| F | R15B       | R15W (R8B)     | R15D (R8W)      |                              |
+---+------------+----------------+-----------------+------------------------------+
| 0 |            | ES             |                 | Extra Segment                |
| 1 |            | CS             |                 | Code Segment                 |
| 2 |            | SS             |                 | Stack Segment                | } segment registers
| 3 |            | DS             |                 | Data Segment                 |
| 4 |            | FS             |                 | Protected extra segment      |
| 5 |            | GS             |                 | Protected extra segment      |
+---+------------+----------------+-----------------+------------------------------+
| - | FLAGS      | EFLAGS (FLAGS) | RFLAGS (EFLAGs) | Flags register               |
| - | -          | IP             | EIP (IP)        | Instruction pointer          |  ⎞
+---+------------+----------------+-----------------+------------------------------+  ⎬ other registers
| - | SPL        |                |                 | Lower byte of SP             |  ⎠
| - | BPL        |                |                 | Lower byte of BP             |
| - | SIL        |                |                 | Lower byte of SI             |
| - | DIL        |                |                 | Lower byte of DI             |
+---+------------+----------------+-----------------+------------------------------+
````

Parenthesis indicate which smaller register(s) are included in the low (+ high) bytes of the current register.
<br>
If an inner register is updated, the outer is also modified, and vice-versa.


**Important flags**

The flags 0-7 are just bits of the 8-bit FLAGS register, included in the 16-bit EFLAGS register which contains the flags 0-15.
<br>
RFLAGS contains EFLAGS but is only ised in 64-bit architectures.
<br>
Updating any flags also updates all the FLAGS registers and vice-versa. 

- OF (bit 11) Overflow Flag: is set if the result doesn't fit in the destination operand. Else, it's cleared.
- DF (bit 10) Direction Flag: if it's set (by STD), the string indexes are auto-decremented from highest to lowest address. If it's cleared (by CLD), they are auto-incremented.
- IF (bit 9) Interrupt Flag: if it's set (by STI or POPF), the processor can handle all interrupts. If it's cleared (by CLI or POPF) it can only handle non-maskable interrupts.
- SF (bit 7) Sign Flag: is set if the most significant bit of the result is set (negative number). Else, it's cleared.
- ZF (bit 6) Zero Flag: is set if the result is zero. Else, it's cleared.
- AF (bit 4) Adjust Flag: is set if the four less significant bits of the result generated a carry or borrow on the four upper bits. Else, it's cleared.
- PF (bit 2) Parity Flag: is set if the four less significant bits of the result contain an even (= divisible by 2) number of bits set to 1. Else it's cleared.
- CF (bit 0) Carry Flag: is set if the most significant bit of the result generated a carry. Else, it's cleared.

### pseudocode / specs:

- ````/digit````: some opcodes have 3 extra bits stored in the REG field of the ModR/M byte. ex: ````F6 /3```` means ````NEG r/m8````.
- rel8 (8 bits, signed. Represents a relative address from -128 to +127).
- rel16, rel32 (16 / 32-bit, signed. Represents a relative address from –32,768 to +32,767 / –2,147,483,648 to +2,147,483,647 according to the operand size).
- imm8 (8-bit, signed, Represents an immediate value. It is sign-extended to form a 16 or 32-bit immediate if it's combined with a 16 or 32-bit operand).
- imm16, imm32 (16 / 32-bit, signed. Immediate value).
- r/m8 (8-bit register or a byte from memory).
- r/m16, r/m32 (16 / 32-bit register or value in memory, according to the operand size).
- m, m8, m16, m32, m64, m128 (an operand in memory, expressed as a variable or array name, but pointed to by the DS:(E)SI or ES:(E)DI registers).
- m16int, m32int, m64int (integer operand in memory).
- ST(i) (the i'th element from the top of the FPU register stack (0 to 7), 0 by default).

## Differences between Intel and AT&T Assembly:

### Intel (recommended):

- no prefixes: ````eax````, ````1````, ````80h````, ...
- operands order: ````instr dest, source````
- memory operands: ````[ebx]````
- extended memory operands: ````segreg:[base+index*scale+disp]```` (ex: ````sub eax,[ebx+ecx*4h-20h]````)
- implicit sufixes: ````mov al,bl, mov ax,bx````
- explicit sizes if different from default: ````mov eax, dword ptr [ebx]````

### AT&T (not recommended):

- prefixes: ````%eax````, ````$1````, ````$0x80````, ...
- order: ````instr source, dest````
- memory operands: ````(%ebx)````
- extended memory operands: ````instr %segreg:disp(base,index,scale)```` (ex: ````subl -0x20(%ebx,%ecx,0x4),%eax````)
- explicit suffixes: ````movb %bl,%al, movw %bx,%ax````

## Binary instructions format

### General

- Instruction prefixes (1 byte each, up to 4 prefixes, optional).
- Mandatory prefix (1 byte, optional).
- REX Prefix (1 byte, optional, 64-bit only).
- Opcode (1 to 4 bytes).
- ModR/M (1 byte, if required: 2 bits for Mod, 3 bits for Reg/Opcode, 3 bits for R/M).
- SIB (1 byte, if required: 2 bits for Scale, 3 bits for Index, 3 bits for Base).
- Displacement (1/2/4 bytes or none).
- Immediate (1/2/4 bytes or none).

The total can't exceed 15 bytes on recent CPUs, or an exception is triggered.

### Prefixes

Two prefixes of a same group can't be used together.
<br>
(In practice, it's possible to use the same prefixes many times (uselessly) without error as long as the instruction stays below the 15-byte limit).

***Lock and Repeat:***

- 0xF0 (LOCK): forces exclusive use of a shared memory in a multiprocessor environment. Can be ignored by disassemblers.
- 0xF2 (REPNE/REPNZ): repeats the instruction for each element of a string or I/O instructions, as long as the zero flag isn't set and rCX != 0.
- 0xF3 (REP/REPE/REPZ): repeats, as long as the zero flag is set and rCX == 0.
- 0xF2 can also be a bound prefix in special conditions (not clear yet).

***Segment Override:***

- 0x2E: CS is used instead of the default segment of an instruction.
- 0x36: same, for SS.
- 0x3E: same, for DS.
- 0x26: same, for ES.
- 0x64: same, for FS.
- 0x65: same, for GS.
- For Jcc instructions, 0x2E prefix hints that the branch is unlikely to be taken and 0x3E hints that it's likely to be taken.

***Operand-Size Override:***

- 0x66: switching to non-default size. (on 32-bit environments, use 16-bit operands for instructions using 32-bit operands by default, and vice-versa).

***Address-Size Override:***

- 0x67: switching to non-default size. (on 32-bit environments, use 16-bit memory accesses for instructions using 32-bit addressing by default, and vice-versa).

### Mandatory prefixes

Mandatory prefixes must precede the first byte of certain opcodes.
This cancels their default behavior.

- 0xF2 (prefix used by many instructions)
- 0xF3 (prefix used by OPCNT, LZCNT and ADOX)
- 0x66 (prefix used by some SSE instructions)

### Opcode

The opcode byte(s) defines the instruction itself.
 
- 1-byte opcodes can have any value except 0x0F.
- 2-byte opcodes have a mandatory prefix (or not, depending on the instruction), the escape byte 0x0F and a second opcode byte.
- 3-byte opcodes are the same with 2 final bytes

Some opcodes contain a bit field specifying a register operand.

### ModR/M

This byte is used by some instructions to determine how its operands are used.

- Mod (2 bits) defines the addressing mode:

  - 00: no displacement.
  - 01: 8-bit displacement.
  - 10: displacement of 16 or 32 bits, depending on the decoding mode.
  - 11: use only general-purpose registers.
  
- REG (3 bits) can contain 3 extra opcode bits, or specify a (source or destination) operand register.
- R/M (3 bits) can be combined with the Mod bits to define an addressing mode or 5 extra opcode bits, or specify an operand register.

ModR/M table:

````
+-----------+----------------------------------------+
| REG       | 000  001  010  011  100  101  110  111 |  
+-----------+----------------------------------------+
| /digit    | 0    1    2    3    4    5    6    7   |  
| r8(/r)    | AL   CL   DL   BL   AH   CH   DH   BH  | 
| r16(/r)   | AX   CX   DX   BX   SP   BP   SI   DI  | 
| r32(/r)   | EAX  ECX  EDX  EBX  ESP  EBP  ESI  EDI | 
| mm(/r)    | MM0  MM1  MM2  MM3  MM4  MM5  MM6  MM7 | 
| xmm(/r)   | XMM0 XMM1 XMM2 XMM3 XMM4 XMM5 XMM6 XMM7| 
| sreg      | ES   CS   SS   DS   FS   GS   res. res.| 
| eee       | CR0  invd CR2  CR3  CR4  invd invd invd| 
| eee       | DR0  DR1  DR2  DR3  DR41 DR51 DR6  DR7 | 
+-----+-----+----------------------------------------+-------------------------+-------------------------+
| Mod | R/M | ModR/M byte (hex)                      | Effective Address (16b) | Effective Address (32b) |
+-----+-----+----------------------------------------+-------------------------+-------------------------+
| 00  | 000 | 00   08   10   18   20   28   30   38  | [BX+SI]                 | [EAX]                   |
|     | 001 | 01   09   11   19   21   29   31   39  | [BX+DI]                 | [ECX]                   |
|     | 010 | 02   0A   12   1A   22   2A   32   3A  | [BP+SI]                 | [EDX]                   |
|     | 011 | 03   0B   13   1B   23   2B   33   3B  | [BP+DI]                 | [EBX]                   |
|     | 100 | 04   0C   14   1C   24   2C   34   3C  | [SI]                    | [sib]                   |
|     | 101 | 05   0D   15   1D   25   2D   35   3D  | [DI]                    | [EIP]+disp32            |
|     | 110 | 06   0E   16   1E   26   2E   36   3E  | disp16                  | [ESI]                   |
|     | 111 | 07   0F   17   1F   27   2F   37   3F  | [BX]                    | [EDI]                   |
+-----+-----+----------------------------------------+-------------------------+-------------------------+
| 01  | 000 | 40   48   50   58   60   68   70   78  | [BX+SI]+disp8           | [EAX]+disp8             |
|     | 001 | 41   49   51   59   61   69   71   79  | [BX+DI]+disp8           | [EDX]+disp8             |
|     | 010 | 42   4A   52   5A   62   6A   72   7A  | [BP+SI]+disp8           | [EDX]+disp8             |
|     | 011 | 43   4B   53   5B   63   6B   73   7B  | [BP+DI]+disp8           | [EBX]+disp8             |
|     | 100 | 44   4C   54   5C   64   6C   74   7C  | [SI]+disp8              | [sib]+disp8             |
|     | 101 | 45   4D   55   5D   65   6D   75   7D  | [DI]+disp8              | [EBP]+disp8             |
|     | 110 | 46   4E   56   5E   66   6E   76   7E  | [BP]+disp8              | [ESI]+disp8             |
|     | 111 | 47   4F   57   5F   67   6F   77   7F  | [BX]+disp8              | [EDI]+disp8             |
+-----+-----+----------------------------------------+-------------------------+-------------------------+
| 10  | 000 | 80   88   90   98   A0   A8   B0   B8  | [BX+SI]+disp16          | [EAX]+disp32            |
|     | 001 | 81   89   91   99   A1   A9   B1   B9  | [BX+DI]+disp16          | [ECX]+disp32            |
|     | 010 | 82   8A   92   9A   A2   AA   B2   BA  | [BP+SI]+disp16          | [EDX]+disp32            |
|     | 011 | 83   8B   93   9B   A3   AB   B3   BB  | [BP+DI]+disp16          | [EBX]+disp32            |
|     | 100 | 84   8C   94   9C   A4   AC   B4   BC  | [SI]+disp16             | [sib]+disp32            |
|     | 101 | 85   8D   95   9D   A5   AD   B5   BD  | [DI]+disp16             | [EBP]+disp32            |
|     | 110 | 86   8E   96   9E   A6   AE   B6   BE  | [BP]+disp16             | [ESI]+disp32            |
|     | 111 | 87   8F   97   9F   A7   AF   B7   BF  | [BX]+disp16             | [EDI]+disp32            |
+-----+-----+----------------------------------------+-------------------------+-------------------------+
| 11  | 000 | C0   C8   D0   D8   E0   E8   F0   F8  | AL/AX/EAX/ST0/MM0/XMM0  | AL/AX/EAX/ST0/MM0/XMM0  |
|     | 001 | C1   C9   D1   D9   E1   E9   F1   F9  | CL/CX/ECX/ST1/MM1/XMM1  | CL/CX/ECX/ST1/MM1/XMM1  |
|     | 010 | C2   CA   D2   DA   E2   EA   F2   FA  | DL/DX/EDX/ST2/MM2/XMM2  | DL/DX/EDX/ST2/MM2/XMM2  |
|     | 011 | C3   CB   D3   DB   E3   EB   F3   FB  | BL/BX/EBX/ST3/MM3/XMM3  | BL/BX/EBX/ST3/MM3/XMM3  |
|     | 100 | C4   CC   D4   DC   E4   EC   F4   FC  | AH/SP/ESP/ST4/MM4/XMM4  | AH/SP/ESP/ST4/MM4/XMM4  |
|     | 101 | C5   CD   D5   DD   E5   ED   F5   FD  | CH/BP/EBP/ST5/MM5/XMM5  | CH/BP/EBP/ST5/MM5/XMM5  |
|     | 110 | C6   CE   D6   DE   E6   EE   F6   FE  | DH/SI/ESI/ST6/MM6/XMM6  | DH/SI/ESI/ST6/MM6/XMM6  |
|     | 111 | C7   CF   D7   DF   E7   EF   F7   FF  | BH/DI/EDI/ST7/MM7/XMM7  | BH/DI/EDI/ST7/MM7/XMM7  |
+-----+-----+----------------------------------------+-------------------------+-------------------------+
````


### SIB

SIB is not used in 16-bit environments. It allows to use an absolute address as one of the ModR/M fields.
<br>
This byte is read in two cases, just after the ModR/M byte, and depending on its content:

- If one of the ModR/M fields refers to the ESP register.
- If Mod == 00 and R/M == 5 (EBP). In this case, EBP is ignored.

(So the only way to use EBP is to have Mod = 01 and 8-bit displacement = 0).

It contains:

- 2 bits for Scale
- 3 bits for Index, representing any register except ESP
- 3 bits for Base

and targets the address [Index * 2 ^ Scale + Base].


SIB table:

````
+----------------------+-----------------------------------------------+
| Base                 | 000   001   010   011   100   101   110   111 |
| decimal              | 0     1     2     3     4     5     6     7   |
| r32                  | EAX   ECX   EDX   EBX   ESP   *     ESI   EDI |
+---------+----+-------+-----------------------------------------------+
| SIB     | SS | Index | SIB Byte (hex)                                |
+---------+----+-------+-----------------------------------------------+
| [EAX]   | 00 | 000   | 00    01    02    03    04    05    06    07  |
| [ECX]   |    | 001   | 08    09    0A    0B    0C    0D    0E    0F  |
| [EDX]   |    | 010   | 10    11    12    13    14    15    16    17  |
| [EBX]   |    | 011   | 18    19    1A    1B    1C    1D    1E    1F  |
| none    |    | 100   | 20    21    22    23    24    25    26    27  |
| [EBP]   |    | 101   | 28    29    2A    2B    2C    2D    2E    2F  |
| [ESI]   |    | 110   | 30    31    32    33    34    35    36    37  |
| [EDI]   |    | 111   | 38    39    3A    3B    3C    3D    3E    3F  |
+---------+----+-------+-----------------------------------------------+
| [EAX*2] | 01 | 000   | 40    41    42    43    44    45    46    47  |
| [ECX*2] |    | 001   | 48    49    4A    4B    4C    4D    4E    4F  |
| [EDX*2] |    | 010   | 50    51    52    53    54    55    56    57  |
| [EBX*2] |    | 011   | 58    59    5A    5B    5C    5D    5E    5F  |
| none    |    | 100   | 60    61    62    63    64    65    66    67  |
| [EBP*2] |    | 101   | 68    69    6A    6B    6C    6D    6E    6F  |
| [ESI*2] |    | 110   | 70    71    72    73    74    75    76    77  |
| [EDI*2] |    | 111   | 78    79    7A    7B    7C    7D    7E    7F  |
+---------+----+-------+-----------------------------------------------+
| [EAX*4] | 10 | 000   | 80    81    82    83    84    85    86    87  |
| [ECX*4] |    | 001   | 88    89    8A    8B    8C    8D    8E    8F  |
| [EDX*4] |    | 010   | 90    91    92    93    94    95    96    97  |
| [EBX*4] |    | 011   | 98    99    9A    9B    9C    9D    9E    9F  |
| none    |    | 100   | A0    A1    A2    A3    A4    A5    A6    A7  |
| [EBP*4] |    | 101   | A8    A9    AA    AB    AC    AD    AE    AF  |
| [ESI*4] |    | 110   | B0    B1    B2    B3    B4    B5    B6    B7  |
| [EDI*4] |    | 111   | B8    B9    BA    BB    BC    BD    BE    BF  |
+---------+----+-------+-----------------------------------------------+
| [EAX*8] | 11 | 000   | C0    C1    C2    C3    C4    C5    C6    C7  |
| [ECX*8] |    | 001   | C8    C9    CA    CB    CC    CD    CE    CF  |
| [EDX*8] |    | 010   | D0    D1    D2    D3    D4    D5    D6    D7  |
| [EBX*8] |    | 011   | D8    D9    DA    DB    DC    DD    DE    DF  |
| none    |    | 100   | E0    E1    E2    E3    E4    E5    E6    E7  |
| [EBP*8] |    | 101   | E8    E9    EA    EB    EC    ED    EE    EF  |
| [ESI*8] |    | 110   | F0    F1    F2    F3    F4    F5    F6    F7  |
| [EDI*8] |    | 111   | F8    F9    FA    FB    FC    FD    FE    FF  |
+---------+----+-------+-----------------------------------------------+

(*) If base == 5, its value depends on the Mod bits of the ModR/M byte:
- 00: base = disp32
- 01: base = EBP + disp8
- 10: base = EBP + disp32

````

### Displacement

Displacement (optional) is encoded on 1, 2 or 4 bytes according to the Mod and R/M bits, and must follow the ModR/M or the SIB byte.

### Immediate

A signed number (optional), directly encoded on 1, 2 or 4 bytes, according to the decoding mode and prefixes. It must be at the end of the instruction.

## Instruction set

Legend:
- Operands with ````!```` are implicit.
- Operands with ````*```` are modified.
- Only the flags affected are represented (in the set ````odiszapc````).
- The column "Ref." points to the corresponding chapter & page in Intel's manual reference vol.2.
- "x" column: ````L```` means the instruction can use a ````LOCK```` prefix. ````s```` means that an additional ````push````. ````p```` means an additional ````pop````. P means two ````pop````'s.

### 1-byte instructions

````
+--------+--------+---+----------+--------------+----------+----------+----------+----------+-------+----------------------
| Prefix | Opcode | x | Mnemonic | Op. 1        | Op. 2    | Op. 3    | Op. 4    | Flags    | Ref.  | Pseudocode
+--------+--------+---+----------+--------------+----------+----------+----------+----------+-------+----------------------
|        | 00 /r  | L | ADD      | r/m8*        | r8       |          |          | o..szapc | 3-31  | DEST ← DEST + SRC;
|        | 01 /r  | L |          | r/m16/32*    | r16/32   |          |          |          |       |
|        | 02 /r  |   |          | r8*          | r/m8     |          |          |          |       |
|        | 03 /r  |   |          | r16/32*      | r/m6/32  |          |          |          |       |
|        | 04     |   |          | AL*          | imm8     |          |          |          |       |
|        | 05     |   |          | eAX*         | imm16/32 |          |          |          |       |
+--------+--------+---+----------+--------------+----------+----------+----------+----------+-------+----------------------
|        | 06     |   | PUSH     | ES           |          |          |          |          | 4-511 | to be continued ... v
+--------+--------+---+----------+--------------+----------+----------+----------+----------+-------+----------------------
|        | 07     |   | POP      | ES*          |          |          |          |          | 4-385 |
+--------+--------+---+----------+--------------+----------+----------+----------+----------+-------+----------------------
|        | 08 /r  | L | OR       | r/m8*        | r8       |          |          | o..szapc | 4-166 |
|        | 09 /r  | L |          | r/m16/32*    | r16/32   |          |          |          |       |
|        | 0A /r  |   |          | r8*          | r/m8     |          |          |          |       |
|        | 0B /r  |   |          | r16/32*      | r/m6/32  |          |          |          |       |
|        | 0C     |   |          | AL*          | imm8     |          |          |          |       |
|        | 0D     |   |          | eAX*         | imm16/32 |          |          |          |       |
+--------+--------+---+----------+--------------+----------+----------+----------+----------+-------+----------------------
|        | 0E     |   | PUSH     | CS           |          |          |          |          | 4-511 |
+--------+--------+---+----------+--------------+----------+----------+----------+----------+-------+----------------------
|        | 0F     |   | (2-byte instructions prefix)                             |          |       |
+--------+--------+---+----------+--------------+----------+----------+----------+----------+-------+----------------------
|        |        |   |          |              |          |          |          |          |       |

to be continued...

````

### 2-byte instructions

````
to be continued...
````