# x86 demos decompilation & emulation: TL;DR

---

## Summary

- [Introduction](#introduction)
- [Terminology](#terminology)
- [Memory and registers](#memory-and-registers)
- [Binary instructions format](#binary-instructions-format)
- [Instruction set](#instruction-set)
- [Compilation & test](#compilation--test)
- [Disassembly](#disassembly)
- [Emulation](#emulation)
- [Sources](#sources)

---

## Introduction

This document explains as briefly as possible how to decompile x86 binary into Assembly language, and emulate it.
<br>
It'll focus on MS-DOS-like 16-bit and 32-bit x86 binary built into .COM files, Intel's Assembly syntax and JavaScript emulation.
<br>
Anything related to 8-bit and 64-bit architectures, VEX / EVEX instructions and exceptions is ignored for now.

---

## Terminology

### Hardware:

- 80x86 and x86 refer to the 16 and 32-bit microprocessors and ISA (instruction set architectures) developed by Intel.
- IA-32 and i386+ refer only to the 32-bit architecture, introduced with the Intel 80386 processor.
- IA-64, Intel 64, Itanium, x86-64, AMD64 IA-32e refer to the 64-bit architecture.
- 64-bit and 32-bit ISAs are backwards-compatible down to the 16-bit one, introduced with the Intel 8086 processor.
- The processor (and the instruction prefixes used) define the size of the registers and addresses used (16, 32 or 64 bits).
- Intel and AMD processors' architectures are compatible with each other. 
- x86 processors use little-endianness for multi-byte numbers (ex: ````0xA0B70708```` is stored as: ````08 07 B7 A0````).
- DosBox's default speed is 3000 cycles/frame (~ 0.18Mhz) which is quite slow compared to 8086 (> 4.77Mhz) or 80386 (> 12Mhz).
- In terms of millions of instructions per second, the 8085 runs at ~0.75 MIPS max while the 80386 runs at ~11 MIPS.

### .COM files

- 64kb max, no segmentation (code and data are put together in the same memory area).
- Loaded at memory address 0x100 (the entry point).
- No header (contains directly the first binary instruction, as if it was at the address 0x100).
- Data is mixed with machine code. So it's possible for a demo to reuse or modify bytes that belong to actual instructions, as if they were numbers or text.
- Program's bytes can mean many different things according to the state of the registers and memory. It's possible for a program (like [m8trix](https://github.com/xem/minix86/blob/gh-pages/tests/m8trix.asm)) to jump to a byte that was originally in the middle of an instruction to reuse its last bytes differently.
- Of course, some bytes can be used as data only, and are never executed as-is.

### Assembly:

- ASM files (before being compiled into .COM files) start with the statement ````org 100h```` (the entry point address). There's no trace of it in the .COM file.
- Labels are written as: ````label: instruction```` (ex: ````LOADREG: MOV EAX, SUBTOTAL````).
- Afer compilation, labels disappear and every jump to a certain label becomes a jump to the memory address of the instruction in front of it.
- Hex numbers: ````89ABh````.
- Binary numbers:  ````1010b````.
- Segmented addressing: ````Segment-register:Byte-address```` (ex: ````DS:FF79h```` or ````CS:EIP````).
- The statement ````db```` is not translated into a binary instruction. It is used to place one or many bytes (numbers or strings) "right there" in the executable file. It can be used to define the program's data. (ex: ````text: db 'Hello World!$'````)
- the register prefix ````r```` is used to specify a register of any size (ex: ````rCX```` can refer to CX (16 bits), ECX (32 bits) or RCX (64 bits)).

### Intel's Assembly syntax:

- no prefixes: ````eax````, ````1````, ````80h````, ...
- operands order: ````instr dest, source````
- memory operands: ````[ebx]````
- extended memory operands: ````segreg:[base+index*scale+disp]```` (ex: ````sub eax,[ebx+ecx*4h-20h]````)
- implicit sufixes: ````mov al,bl, mov ax,bx````
- explicit sizes if different from default: ````mov eax, dword ptr [ebx]````

### AT&T Assembly syntax (not recommended):

- prefixes: ````%eax````, ````$1````, ````$0x80````, ...
- operands order: ````instr source, dest````
- memory operands: ````(%ebx)````
- extended memory operands: ````instr %segreg:disp(base,index,scale)```` (ex: ````subl -0x20(%ebx,%ecx,0x4),%eax````)
- explicit suffixes: ````movb %bl,%al````, ````movw %bx,%ax````

---

## Memory and registers

### Important Registers

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
| - | -          | IP             | EIP (IP)        | Instruction pointer          |
+---+------------+----------------+-----------------+------------------------------+
````

Register between parenthesis are included in the lower bytes of the current register.
<br>
If an inner register is updated, the outer is also modified, and vice-versa.

**Other registers (not sure if some are specific to 64-bit processors)**

- XMM0 to XMM15 are 128 bits long and nested in the YMM (256 bits) and ZMM (512 bits) registers.
- MM0 to MM7 are 64 bits long and are nested in the 80-bits FPU registers ST(0) to ST(7). (but according to [x86 oddities](https://code.google.com/archive/p/corkami/wikis/x86oddities.wiki), MM0 to MMZ actually match ST(7) to ST(0), in reverse order. Is it true?)
- These four 1-byte registers are used sometimes but not accessible directly:
  - SPL: the lower byte of SP
  - BPL: the lower byte of BP
  - SIL: the lower byte of SI
  - DIL: the lower byte of DI


**Default values**

All registers are initialized to 0 except:
- CX = 00FF
- SI = 0100
- DI = FFFE
- SP = FFFE
- DX, DS, ES, SS = CS (due to the .COM file) = 0100 (right?)


### Flags

FLAGS is a 16-bit register containing the flags 0 to 15.
<br>
EFLAGS is a 32-bit register containing FLAGS and the flags 16 to 21 (ignored here).
<br>
RFLAGS is a 64-bit register containing EFLAGS but it is only used in 64-bit architectures.
<br>
Updating any flags also updates all the FLAGS registers and vice-versa.

````
+---------------+----+-----+-----+----+----+----+-----+----+-------+----+----+----+----+----+----+-----+----+-----+----+-----+----+
| Bits 63 to 22 | 21 | 20  | 19  | 18 | 17 | 16 | 15  | 14 | 12-13 | 11 | 10 | 9  | 8  | 7  | 6  | 5   | 4  | 3   | 2  | 1   | 0  |
+---------------+----+-----+-----+----+----+----+-----+----+-------+----+----+----+----+----+----+-----+----+-----+----+-----+----+
| Reserved (R)  | ID | VIP | VIF | AC | VM | RF | (R) | NT | IOPL  | OF | DF | IF | TF | SF | ZF | (R) | AF | (R) | PF | (R) | CF |
+---------------+----+-----+-----+----+----+----+-----+----+-------+----+----+----+----+----+----+-----+----+-----+----+-----+----+
````

**Important flags**

- Bit 15 is reserved and its value is 0.
- Bit 11 - Overflow Flag: is set if the result doesn't fit in the destination operand. Else, it's cleared.
- Bit 10 - Direction Flag: if it's set (by STD), the string indexes are auto-decremented from highest to lowest address. If it's cleared (by CLD), they are auto-incremented.
- Bit 9 - Interrupt Flag: if it's set (by STI or POPF), the processor can handle all interrupts. If it's cleared (by CLI or POPF) it can only handle non-maskable interrupts.
- Bit 7 - Sign Flag: is set if the most significant bit of the result is set (negative number). Else, it's cleared.
- Bit 6 - Zero Flag: is set if the result is zero. Else, it's cleared.
- Bit 5 is reserved and it's value is 0.
- Bit 4 - Adjust Flag: is set if the four less significant bits of the result generated a carry or borrow on the four upper bits. Else, it's cleared.
- Bit 3 is reserved and it's value is 0.
- Bit 2 - Parity Flag: is set if the four less significant bits of the result contain an even (= divisible by 2) number of bits set to 1. Else it's cleared.
- Bit 1 is reserved and it's value is 1.
- Bit 0 - Carry Flag: is set if the most significant bit of the result generated a carry. Else, it's cleared.



### Stack

The stack is an area in the RAM used to push and pop bytes while updating the value of the stack pointer to the last value that was stored: SP (in 16-bit mode), ESP (in 32-bit mode) or RSP (in 64-bit mode).
<br>
It starts at the address FFFE (or FFFC if the program is a DOS child process), decreases at each PUSH and increases at each POP.
<br>
The top stack usually contains the value ````0000h````.




### Segments and segment registers

Segmentation is usually used to separate code, data, stack, etc. In .COM files, there's only one segment, and all the segment registers point to it.
<br>
The segment registers can be set to different values in order to read/write easily in special addresses via specific instructions:

- Write on DS with ````mov````.
- Write on SS with ````push````.
- Write on ES with ````stosb````.

(right?)

---

## Binary instructions format

### Structure

````
+----------------------+------------------+------------+--------+--------+-----+--------------+-----------+
| Instruction prefixes | Mandatory prefix | REX prefix | Opcode | ModR/M | SIB | Displacement | Immediate |
+----------------------+------------------+------------+--------+--------+-----+--------------+-----------+
````

- Instruction prefixes (1 byte each, up to 4 prefixes, optional).
- Mandatory prefix (1 byte, optional).
- REX Prefix (1 byte, optional, only for 64-bits).
- Opcode (1 to 4 bytes).
- ModR/M (1 byte, if required: 2 bits for Mod, 3 bits for Reg/Opcode, 3 bits for R/M).
- SIB (1 byte, if required: 2 bits for Scale, 3 bits for Index, 3 bits for Base).
- Displacement (1/2/4 bytes or none).
- Immediate (1/2/4 bytes or none).

The total size of an instruction is at least 1 byte (the opcode) and can't exceed 15 bytes (else, an exception is triggered).

### Instruction prefixes

Two prefixes of a same group can't be used together:

**Lock and Repeat:**

- ````0xF0```` (LOCK): forces exclusive use of a shared memory in a multiprocessor environment. Can be ignored by disassemblers.
- ````0xF2```` (REPNE/REPNZ): repeats the instruction for each element of a string or I/O instructions, as long as the zero flag isn't set and rCX != 0.
- ````0xF3```` (REP/REPE/REPZ): repeats, as long as the zero flag is set and rCX == 0.
- ````0xF2```` can also be a bound prefix in special conditions (not clear yet).

**Segment Override:**

- ````0x2E````: CS is used instead of the default segment of an instruction.
- ````0x36````: same, for SS.
- ````0x3E````: same, for DS.
- ````0x26````: same, for ES.
- ````0x64````: same, for FS.
- ````0x65````: same, for GS.

Exception: for JCC instructions, ````0x2E```` prefix hints that the branch is unlikely to be taken and 0x3E hints that it's likely to be taken.

**Operand-Size Override:**

- ````0x66````: switching to non-default size. (on 32-bit environments, use 16-bit operands for instructions using 32-bit operands by default, and vice-versa).

**Address-Size Override:**

- ````0x67````: switching to non-default size. (on 32-bit environments, use 16-bit memory accesses for instructions using 32-bit addressing by default, and vice-versa).

NB: In practice, it's possible to use the same prefixes many times (uselessly) without error as long as the instruction stays below the 15-byte limit. Ex: ````66 66 66 66 66 66 66 66 66 66 66 66 66 66 90: nop````.

### Mandatory prefixes

Mandatory prefixes must precede the first byte of certain opcodes.
<br>
This cancels their default behavior.

- ````0xF2```` (prefix used by many instructions)
- ````0xF3```` (prefix used by OPCNT, LZCNT and ADOX)
- ````0x66```` (prefix used by some SSE instructions)

### Opcode

The opcode byte(s) defines the instruction itself.

- [1-byte opcodes](http://www.sandpile.org/x86/opc_1.htm) can have any value except 0x0F or a prefix.
- [2-byte opcodes](http://www.sandpile.org/x86/opc_2.htm) contain the escape byte 0x0F and a second opcode byte except 0x38 and 0x3A.
- [3-byte opcodes](http://www.sandpile.org/x86/opc_3.htm) contain the escape bytes 0x0F38 or 0x0F3A and a third opcode byte.

Some opcodes contain a bit field specifying a register operand. (ex: instructions ````40```` to ````47```` (noted "40+r") perform the same operation ````INC```` on 8 different registers)

### ModR/M

This byte is used by some instructions to determine how its operands are used.

- Mod (2 bits) defines the addressing mode:

  - ````00````: no displacement.
  - ````01````: 8-bit displacement.
  - ````10````: displacement of 16 or 32 bits, depending on the decoding mode.
  - ````11````: use only general-purpose registers.

- REG (3 bits) can contain 3 extra opcode bits, or specify a (source or destination) operand register.
- R/M (3 bits) can be combined with the Mod bits to define an addressing mode or 5 extra opcode bits, or specify an operand register.

**ModR/M table**

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
This byte is read in only two cases, just after the ModR/M byte:

- If one of the ModR/M fields refers to the ESP register.
- If Mod == 00 and R/M == 5 (EBP). In this case, EBP is not used, and the SIB byte is used instead.

(This means that the only way to use EBP as-is via ModR/M is to have Mod = 01 + 8-bit displacement = 0).

It contains:

- 2 bits for Scale
- 3 bits for Index, representing any register except ESP
- 3 bits for Base

and targets the address [Index * 2 ^ Scale + Base].


**SIB table**

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
````

(*) If base == 5, its value depends on the Mod bits of the ModR/M byte:
- 00: base = disp32
- 01: base = EBP + disp8
- 10: base = EBP + disp32

### Displacement

Displacement (optional) is encoded on 1, 2 or 4 bytes according to the Mod and R/M bits, and must follow the ModR/M or the SIB byte.

### Immediate

A signed number (optional), directly encoded on 1, 2 or 4 bytes, according to the decoding mode and prefixes. It must be at the end of the instruction.

---

## Instruction set

**Legend**

- In the "Opcode" column: ````/digit```` means that the opcode has 3 extra bits stored in the REG field of the ModR/M byte. ex: ````F6 /3```` means ````NEG r/m8````. ````/r```` means that the instruction's register operand is stored in the REG field of ModR/M.
- In the "x" column, ````L```` means the instruction can use a ````LOCK```` prefix. ````s```` means that an additional ````push````. ````p```` means an additional ````pop````. P means two ````pop````'s.
- In the operands columns, operands with ````!```` are implicit, operands with ````*```` are modified.
- In the "Flags" column, only the flags affected are represented (in the set ````odiszapc````).
- The column "Ref." points to the corresponding chapter & page in Intel's manual reference vol. 2.

**Operand types**

- ````rel8```` (8 bits, signed. Represents a relative address from -128 to +127).
- ````rel16````, ````rel32```` (16 / 32-bit, signed. Represents a relative address from –32,768 to +32,767 / –2,147,483,648 to +2,147,483,647 according to the operand size).
- ````imm8```` (8-bit, signed, Represents an immediate value. It is sign-extended to form a 16 or 32-bit immediate if it's combined with a 16 or 32-bit operand).
- ````imm16````, ````imm32```` (16 / 32-bit, signed. Immediate value).
- ````r/m8```` (8-bit register or a byte from memory).
- ````r/m16````, ````r/m32```` (16 / 32-bit register or value in memory, according to the operand size).
- ````m````, ````m8````, ````m16````, ````m32````, ````m64````, ````m128```` (an operand in memory, expressed as a variable or array name, but pointed to by the DS:(E)SI or ES:(E)DI registers).
- ````m16int````, ````m32int````, ````m64int```` (integer operand in memory).
- ````ST(i)```` (the i'th element from the top of the FPU register stack (0 to 7), 0 by default).


### 1-byte instructions

````
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
| Prefix | Opcode   | x | Mnemonic | Operand 1     | Operand 2     | Operand 3     | Operand 4     | Flags    | Ref.  | Pseudocode
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 00 /r    | L | ADD      | r/m8*         | r8            |               |               | o..szapc | 3-31  | DEST ← DEST + SRC;
|        | 01 /r    | L |          | r/m16/32*     | r16/32        |               |               |          |       |
|        | 02 /r    |   |          | r8*           | r/m8          |               |               |          |       |
|        | 03 /r    |   |          | r16/32*       | r/m6/32       |               |               |          |       |
|        | 04       |   |          | AL*           | imm8          |               |               |          |       |
|        | 05       |   |          | eAX*          | imm16/32      |               |               |          |       |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 06       |   | PUSH     | ES            |               |               |               |          | 4-511 | ESP ← ESP - 2; Memory[SS:ESP] ← ES;
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 07       |   | POP      | ES*           |               |               |               |          | 4-385 | ES ← Memory[SS:ESP]; ESP ← ESP + 2;
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 08 /r    | L | OR       | r/m8*         | r8            |               |               | o..szapc | 4-166 | DEST ← DEST OR SRC;
|        | 09 /r    | L |          | r/m16/32*     | r16/32        |               |               |          |       |
|        | 0A /r    |   |          | r8*           | r/m8          |               |               |          |       |
|        | 0B /r    |   |          | r16/32*       | r/m6/32       |               |               |          |       |
|        | 0C       |   |          | AL*           | imm8          |               |               |          |       |
|        | 0D       |   |          | eAX*          | imm16/32      |               |               |          |       |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 0E       |   | PUSH     | CS            |               |               |               |          | 4-511 | ESP ← ESP + 2; Memory[SS:ESP] ← CS;
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 10 /r    | L | ADC      | r/m8*         | r8            |               |               | o..szapc | 3-26  | DEST ← DEST + SRC + CF;
|        | 11 /r    | L | ADC      | r/m16/32*     | r16/32        |               |               | o..szapc |       |
|        | 12 /r    |   | ADC      | r8*           | r/m8          |               |               | o..szapc |       |
|        | 13 /r    |   | ADC      | r16/32*       | r/m16/32      |               |               | o..szapc |       |
|        | 14       |   | ADC      | AL*           | imm8          |               |               | o..szapc |       |
|        | 15       |   | ADC      | eAX*          | imm16/32      |               |               | o..szapc |       |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 16       |   | PUSH     | SS            |               |               |               |          | 4-511 | ESP ← ESP + 2; Memory[SS:ESP] ← SS;
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 17       |   | POP      | SS*           |               |               |               |          | 4-385 | SS ← Memory[SS:ESP]; ESP ← ESP + 2;
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 18 /r    | L | SBB      | r/m8*         | r8            |               |               | o..szapc | 4-590 | DEST ← (DEST – (SRC + CF));
|        | 19 /r    | L | SBB      | r/m16/32*     | r16/32        |               |               | o..szapc |       |
|        | 1A /r    |   | SBB      | r8*           | r/m8          |               |               | o..szapc |       |
|        | 1B /r    |   | SBB      | r16/32*       | r/m16/32      |               |               | o..szapc |       |
|        | 1C       |   | SBB      | AL*           | imm8          |               |               | o..szapc |       |
|        | 1D       |   | SBB      | eAX*          | imm16/32      |               |               | o..szapc |       |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 1E       |   | PUSH     | DS            |               |               |               |          | 4-511 | ESP ← ESP + 2; Memory[SS:ESP] ← DS;
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 1F       |   | POP      | DS*           |               |               |               |          | 4-385 | DS ← Memory[SS:ESP]; ESP ← ESP + 2;
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 20 /r    | L | AND      | r/m8*         | r8            |               |               | o..szapc | 3-61  | DEST ← DEST AND SRC;
|        | 21 /r    | L | AND      | r/m16/32*     | r16/32        |               |               | o..szapc |       |
|        | 22 /r    |   | AND      | r8*           | r/m8          |               |               | o..szapc |       |
|        | 23 /r    |   | AND      | r16/32*       | r/m16/32      |               |               | o..szapc |       |
|        | 24       |   | AND      | AL*           | imm8          |               |               | o..szapc |       |
|        | 25       |   | AND      | eAX*          | imm16/32      |               |               | o..szapc |       |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 27       |   | DAA      | AL*!          |               |               |               | o..szapc | .....   ......
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 28 /r    | L | SUB      | r/m8*         | r8            |               |               | o..szapc |
|        | 29 /r    | L | SUB      | r/m16/32*     | r16/32        |               |               | o..szapc |
|        | 2A /r    |   | SUB      | r8*           | r/m8          |               |               | o..szapc |
|        | 2B /r    |   | SUB      | r16/32*       | r/m16/32      |               |               | o..szapc |
|        | 2C       |   | SUB      | AL*           | imm8          |               |               | o..szapc |
|        | 2D       |   | SUB      | eAX*          | imm16/32      |               |               | o..szapc |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 2F       |   | DAS      | AL*!          |               |               |               | o..szapc |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 30 /r    | L | XOR      | r/m8*         | r8            |               |               | o..szapc |
|        | 31 /r    | L | XOR      | r/m16/32*     | r16/32        |               |               | o..szapc |
|        | 32 /r    |   | XOR      | r8*           | r/m8          |               |               | o..szapc |
|        | 33 /r    |   | XOR      | r16/32*       | r/m16/32      |               |               | o..szapc |
|        | 34       |   | XOR      | AL*           | imm8          |               |               | o..szapc |
|        | 35       |   | XOR      | eAX*          | imm16/32      |               |               | o..szapc |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 37       |   | AAA      | AL*!          | AH*!          |               |               | o..szapc |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 38 /r    |   | CMP      | r/m8          | r8            |               |               | o..szapc |
|        | 39 /r    |   | CMP      | r/m16/32      | r16/32        |               |               | o..szapc |
|        | 3A /r    |   | CMP      | r8            | r/m8          |               |               | o..szapc |
|        | 3B /r    |   | CMP      | r16/32        | r/m16/32      |               |               | o..szapc |
|        | 3C       |   | CMP      | AL            | imm8          |               |               | o..szapc |
|        | 3D       |   | CMP      | eAX           | imm16/32      |               |               | o..szapc |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 3F       |   | AAS      | AL*!          | AH*!          |               |               | o..szapc |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 40+r     |   | INC      | r16/32*       |               |               |               | o..szapc |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 48+r     |   | DEC      | r16/32*       |               |               |               | o..szapc |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 50+r     |   | PUSH     | r16/32        |               |               |               |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 58+r     |   | POP      | r16/32*       |               |
+--------+----------+---+----------+-------+------ +-------+-------+-------+-------+-------+-------+----------+-------+----------------------
|        | 60       |   | PUSHA    | AX!   | CX!   | DX!   | BX!   | SP!   | BP!   | SI!   | DI!   |
|        | 60       |   | PUSHAD   | EAX!  | ECX!  | EDX!  | EBX!  | ESP!  | EBP!  | ESI!  | EDI!  |
+--------+----------+---+----------+-------+-------+-------+-------+-------+-------+-------+-------+----------+-------+----------------------
|        | 61       |   | POPA     | DI*!  | SI*!  | BP*!  | BX*!  | CX*!  | DX*!  | AX*!  |
|        | 61       |   | POPAD    | EDI*! | ESI*! | EBP*! | EBX*! | ECX*! | EDX*! | EAX*! |
+--------+----------+---+----------+-------+-------+-------+-------+-------+-------+-------+-------+----------+-------+----------------------
|        | 62 /r    |   | BOUND    | r16/32        | m16/32&16/32  | eFlags!       |               | ..i..... |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 63 /r    |   | ARPL     | r/m16         | r16           |               |               | ....z... |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 68       |   | PUSH     | imm16/32      |               |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 69 /r    |   | IMUL     | r16/32*       | r/m16/32      | imm16/32      |               | o..szapc |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 6A       |   | PUSH     | imm8          |               |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 6B /r    |   | IMUL     | r16/32*       | r/m16/32      | imm8          |               | o..szapc |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 6C       |   | INS      | m8*           | DX            |                                 ........
|        |          |   | INSB     | m8*!          | DX!           |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 6D       |   | INS      | m16*          | DX            |
|        |          |   | INSW     | m16*!         | DX!           |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 6D       |   | INS      | m16/32*       | DX            |
|        |          |   | INSD     | m32*!         | DX!           |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 6E       |   | OUTS     | DX*           | m8            |
|        |          |   | OUTSB    | DX*!          | m8!           |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 6F       |   | OUTS     | DX*           | m16           |
|        |          |   | OUTSW    | DX*!          | m16!          |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 6F       |   | OUTS     | DX*           | m16/32        |
|        |          |   | OUTSD    | DX*!          | m32!          |
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 70       |   | JO       | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 71       |   | JNO      | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 72       |   | JB       | rel8
|        |          |   | JNAE     | rel8
|        |          |   | JC       | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 73       |   | JNB      | rel8
|        |          |   | JAE      | rel8
|        |          |   | JNC      | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 74       |   | JZ       | rel8
|        |          |   | JE       | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 75       |   | JNZ      | rel8
|        |          |   | JNE      | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 76       |   | JBE      | rel8
|        |          |   | JNA      | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 77       |   | JNBE     | rel8
|        |          |   | JA       | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 78       |   | JS       | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 79       |   | JNS      | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 7A       |   | JP       | rel8
|        |          |   | JPE      | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 7B       |   | JNP      | rel8
|        |          |   | JPO      | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 7C       |   | JL       | rel8
|        |          |   | JNGE     | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 7D       |   | JNL      | rel8
|        |          |   | JGE      | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 7E       |   | JLE      | rel8
|        |          |   | JNG      | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
|        | 7F       |   | JNLE     | rel8
|        |          |   | JG       | rel8
+--------+----------+---+----------+---------------+---------------+---------------+---------------+----------+-------+----------------------
...

````

<!--

TODO:

````
|        | 80 /0    | L | ADD      | r/m8     imm8
|        | 80 /1    | L | OR       | r/m8     imm8
|        | 80 /2    | L | ADC      |  r/m8     imm8
|        | 80 /3    | L | SBB      |  r/m8     imm8
|        | 80 /4    | L | AND      |  r/m8     imm8
|        | 80 /5    | L | SUB      |  r/m8     imm8
|        | 80 /6    | L | XOR      |  r/m8     imm8
|        | 80 /7    |   | CMP      |  r/m8     imm8
|        | 81 /0    | L | ADD      |  r/m16/32     imm16/32
|        | 81 /1    | L | OR       | r/m16/32     imm16/32
|        | 81 /2    | L | ADC      |  r/m16/32     imm16/32
|        | 81 /3    | L | SBB      |  r/m16/32     imm16/32
|        | 81 /4    | L | AND      |  r/m16/32     imm16/32
|        | 81 /5    | L | SUB      |  r/m16/32     imm16/32
|        | 81 /6    | L | XOR      |  r/m16/32     imm16/32
|        | 81 /7    |   | CMP      |  r/m16/32     imm16/32
|        | 82 /0    | L | ADD      |  r/m8     imm8
|        | 82 /1    | L | OR       | r/m8     imm8
|        | 82 /2    | L | ADC      |  r/m8     imm8
|        | 82 /3    | L | SBB      |  r/m8     imm8
|        | 82 /4    | L | AND      |  r/m8     imm8
|        | 82 /5    | L | SUB      |  r/m8     imm8
|        | 82 /6    | L | XOR      |  r/m8     imm8
|        | 82 /7    |   | CMP      |  r/m8     imm8
|        | 83 /0    | L | ADD      |  r/m16/32     imm8
|        | 83 /1    | L | OR       | r/m16/32     imm8
|        | 83 /2    | L | ADC      |  r/m16/32     imm8
|        | 83 /3    | L | SBB      |  r/m16/32     imm8
|        | 83 /4    | L | AND      |  r/m16/32     imm8
|        | 83 /5    | L | SUB      |  r/m16/32     imm8
|        | 83 /6    | L | XOR      |  r/m16/32     imm8
|        | 83 /7    |   | CMP      |  r/m16/32     imm8
|        | 84 /r    |   | TEST     |   r/m8     r8
|        | 85 /r    |   | TEST     |   r/m16/32     r16/32
|        | 86 /r    | L | XCHG     |   r8     r/m8
|        | 87 /r    | L | XCHG     |   r16/32     r/m16/32
|        | 88 /r    |   | MOV      |  r/m8     r8
|        | 89 /r    |   | MOV      |  r/m16/32     r16/32
|        | 8A /r    |   | MOV      |  r8     r/m8
|        | 8B /r    |   | MOV      |  r16/32     r/m16/32
|        | 8C /r    |   | MOV      |  m16     Sreg
|        |          |   | MOV      |  r16/32     Sreg
|        | 8D /r    |   | LEA      |  r16/32     m
|        | 8E /r    |   | MOV      |  Sreg     r/m16
|        | 8F /0    |   | POP      |  r/m16/32
|        | 90+r     |   | XCHG     |   r16/32     eAX
|        | 90       |   | NOP      |
| F3     | 90       |   | PAUSE    |
|        | 98       |   | CBW      |  AX     AL
|        | 98       |   | CWDE     |   EAX     AX
|        | 99       |   | CWD      |  DX     AX
|        | 99       |   | CDQ      |  EDX     EAX
|        | 9A       |   | CALLF    |    ptr16:16/32
|        | 9B       |   | FWAIT    |
|        |          |   | WAIT     |
|        | 9C       |   | PUSHF    |    Flags
|        | 9C       |   | PUSHFD   |     EFlags
|        | 9D       |   | POPF     |   Flags
|        | 9D       |   | POPFD    |    EFlags
|        | 9E       |   | SAHF     |   AH
|        | 9F       |   | LAHF     |   AH
|        | A0       |   | MOV      |  AL     moffs8
|        | A1       |   | MOV      |  eAX     moffs16/32
|        | A2       |   | MOV      |  moffs8     AL
|        | A3       |   | MOV      |  moffs16/32     eAX
|        | A4       |   | MOVS     |   m8     m8
|        |          |   | MOVSB    |    m8     m8
|        | A5       |   | MOVS     |   m16     m16
|        |          |   | MOVSW    |    m16     m16
|        | A5       |   | MOVS     |   m16/32     m16/32
|        |          |   | MOVSD    |    m32     m32
|        | A6       |   | CMPS     |   m8     m8
|        |          |   | CMPSB    |    m8     m8
|        | A7       |   | CMPS     |   m16     m16
|        |          |   | CMPSW    |    m16     m16
|        | A7       |   | CMPS     |   m16/32     m16/32
|        |          |   | CMPSD    |    m32     m32
|        | A8       |   | TEST     |   AL     imm8
|        | A9       |   | TEST     |   eAX     imm16/32
|        | AA       |   | STOS     |   m8     AL
|        |          |   | STOSB    |    m8     AL
|        | AB       |   | STOS     |   m16     AX
|        |          |   | STOSW    |    m16     AX
|        | AB       |   | STOS     |   m16/32     eAX
|        |          |   | STOSD    |    m32     EAX
|        | AC       |   | LODS     |   AL     m8
|        |          |   | LODSB    | AL     m8
|        | AD       |   | LODS     | AX     m16
|        |          |   | LODSW    | AX     m16
|        | AD       |   | LODS     | eAX     m16/32
|        |          |   | LODSD    | EAX     m32
|        | AE       |   | SCAS     | m8     AL
|        |          |   | SCASB    | m8     AL
|        | AF       |   | SCAS     |  m16     AX
|        |          |   | SCASW    |   m16     AX
|        | AF       |   | SCAS     |  m16/32     eAX
|        |          |   | SCASD    |   m32     EAX
|        | B0+r     |   | MOV      | r8     imm8
|        | B8+r     |   | MOV      | r16/32     imm16/32
|        | C0 /0    |   | ROL      | r/m8     imm8
|        | C0 /1    |   | ROR      | r/m8     imm8
|        | C0 /2    |   | RCL      | r/m8     imm8
|        | C0 /3    |   | RCR      | r/m8     imm8
|        | C0 /4    |   | SHL      | r/m8     imm8
|        |          |   | SAL      | r/m8     imm8
|        | C0 /5    |   | SHR      | r/m8     imm8
|        | C0 /6    |   | SAL      | r/m8     imm8
|        |          |   | SHL      | r/m8     imm8
|        | C0 /7    |   | SAR      | r/m8     imm8
|        | C1 /0    |   | ROL      | r/m16/32     imm8
|        | C1 /1    |   | ROR      | r/m16/32     imm8
|        | C1 /2    |   | RCL      | r/m16/32     imm8
|        | C1 /3    |   | RCR      | r/m16/32     imm8
|        | C1 /4    |   | SHL      | r/m16/32     imm8
|        |          |   | SAL      | r/m16/32     imm8
|        | C1 /5    |   | SHR      | r/m16/32     imm8
|        | C1 /6    |   | SAL      | r/m16/32     imm8
|        |          |   | SHL      | r/m16/32     imm8
|        | C1 /7    |   | SAR      | r/m16/32     imm8
|        | C2       |   | RETN     |  imm16
|        | C3       |   | RETN     |
|        | C4 /r    |   | LES      | ES     r16/32     m16:16/32
|        | C5 /r    |   | LDS      | DS     r16/32     m16:16/32
|        | C6 /0    |   | MOV      | r/m8     imm8
|        | C7 /0    |   | MOV      | r/m16/32     imm16/32
|        | C8       |   | ENTER    |   eBP     imm16     imm8
|        | C9       |   | LEAVE    |   eBP
|        | CA       |   | RETF     |  imm16
|        | CB       |   | RETF     |
|        | CC       |   | INT      | 3     eFlags
|        | CD       |   | INT      | imm8     eFlags
|        | CE       |   | INTO     |  eFlags
|        | CF       |   | IRET     |  Flags
|        | CF       |   | IRETD    |   EFlags
|        | D0 /0    |   | ROL      | r/m8
|        | D0 /1    |   | ROR      | r/m8
|        | D0 /2    |   | RCL      | r/m8
|        | D0 /3    |   | RCR      | r/m8
|        | D0 /4    |   | SHL      | r/m8
|        |          |   | SAL      | r/m8
|        | D0 /5    |   | SHR      | r/m8
|        | D0 /6    |   | SAL      | r/m8
|        |          |   | SHL      | r/m8
|        | D0 /7    |   | SAR      | r/m8
|        | D1 /0    |   | ROL      | r/m16/32
|        | D1 /1    |   | ROR      | r/m16/32
|        | D1 /2    |   | RCL      | r/m16/32
|        | D1 /3    |   | RCR      | r/m16/32
|        | D1 /4    |   | SHL      | r/m16/32
|        |          |   | SAL      | r/m16/32
|        | D1 /5    |   | SHR      | r/m16/32
|        | D1 /6    |   | SAL      | r/m16/32
|        |          |   | SHL      | r/m16/32
|        | D1 /7    |   | SAR      | r/m16/32
|        | D2 /0    |   | ROL      | r/m8     CL
|        | D2 /1    |   | ROR      | r/m8     CL
|        | D2 /2    |   | RCL      | r/m8     CL
|        | D2 /3    |   | RCR      | r/m8     CL
|        | D2 /4    |   | SHL      | r/m8     CL
|        |          |   | SAL      | r/m8     CL
|        | D2 /5    |   | SHR      | r/m8     CL
|        | D2 /6    |   | SAL      | r/m8     CL
|        |          |   | SHL      | r/m8     CL
|        | D2 /7    |   | SAR      | r/m8     CL
|        | D3 /0    |   | ROL      | r/m16/32     CL
|        | D3 /1    |   | ROR      | r/m16/32     CL
|        | D3 /2    |   | RCL      | r/m16/32     CL
|        | D3 /3    |   | RCR      | r/m16/32     CL
|        | D3 /4    |   | SHL      | r/m16/32     CL
|        |          |   | SAL      | r/m16/32     CL
|        | D3 /5    |   | SHR      | r/m16/32     CL
|        | D3 /6    |   | SAL      | r/m16/32     CL
|        |          |   | SHL      | r/m16/32     CL
|        | D3 /7    |   | SAR      | r/m16/32     CL
|        | D4 0A    |   | AAM      | AL     AH
|        | D4       |   | AMX      | AL     AH     imm8
|        | D5 0A    |   | AAD      | AL     AH
|        | D5       |   | ADX      | AL     AH     imm8
|        | D6       |   | SALC     |  AL
|        |          |   | SETALC   |    AL
|        | D7       |   | XLAT     |  AL     m8
|        |          |   | XLATB    |   AL     m8
|        | D8 /0    |   | FADD     |  ST     m32real
|        |          |   | FADD     |  ST     STi
|        | D8 /1    |   | FMUL     |  ST     m32real
|        |          |   | FMUL     |  ST     STi
|        | D8 /2    |   | FCOM     |  ST     STi/m32real
|        | D8 D1 /2 |   | FCOM     |  ST     ST1
|        | D8 /3    |   | FCOMP    |   ST     STi/m32real
|        | D8 D9 /3 |   | FCOMP    |   ST     ST1
|        | D8 /4    |   | FSUB     |  ST     m32real
|        |          |   | FSUB     |  ST     STi
|        | D8 /5    |   | FSUBR    |   ST     m32real
|        |          |   | FSUBR    |   ST     STi
|        | D8 /6    |   | FDIV     |  ST     m32real
|        |          |   | FDIV     |  ST     STi
|        | D8 /7    |   | FDIVR    |   ST     m32real
|        |          |   | FDIVR    |   ST     STi
|        | D9 /0    |   | FLD      | ST     STi/m32real
|        | D9 /1    |   | FXCH     |  ST     STi
|        | D9 C9 /1 |   | FXCH     |  ST     ST1
|        | D9 /2    |   | FST      | m32real     ST
|        | D9 D0 /2 |   | FNOP     |
|        | D9 /3    |   | FSTP     |  m32real     ST
|        | D9 /3    |   | FSTP1    |   STi     ST
|        | D9 /4    |   | FLDENV   |    m14/28
|        | D9 E0 /4 |   | FCHS     |  ST
|        | D9 E1 /4 |   | FABS     |  ST
|        | D9 E4 /4 |   | FTST     |  ST
|        | D9 E5 /4 |   | FXAM     |  ST
|        | D9 /5    |   | FLDCW    |   m16
|        | D9 E8 /5 |   | FLD1     |  ST
|        | D9 E9 /5 |   | FLDL2T   |    ST
|        | D9 EA /5 |   | FLDL2E   |    ST
|        | D9 EB /5 |   | FLDPI    |   ST
|        | D9 EC /5 |   | FLDLG2   |    ST
|        | D9 ED /5 |   | FLDLN2   |    ST
|        | D9 EE /5 |   | FLDZ     |  ST
|        | D9 /6    |   | FNSTENV  |     m14/28
| 9B     | D9 /6    |   | FSTENV   |    m14/28
|        | D9 F0 /6 |   | F2XM1    |   ST
|        | D9 F1 /6 |   | FYL2X    |   ST1     ST
|        | D9 F2 /6 |   | FPTAN    |   ST
|        | D9 F3 /6 |   | FPATAN   |    ST1     ST
|        | D9 F4 /6 |   | FXTRACT  |     ST
|        | D9 F5 /6 |   | FPREM1   |    ST     ST1
|        | D9 F6 /6 |   | FDECSTP  |
|        | D9 F7 /6 |   | FINCSTP  |
|        | D9 /7    |   | FNSTCW   |    m16
| 9B     | D9 /7    |   | FSTCW    |   m16
|        | D9 F8 /7 |   | FPREM    |   ST     ST1
|        | D9 F9 /7 |   | FYL2XP1  |     ST1     ST
|        | D9 FA /7 |   | FSQRT    |   ST
|        | D9 FB /7 |   | FSINCOS  |     ST
|        | D9 FC /7 |   | FRNDINT  |     ST
|        | D9 FD /7 |   | FSCALE   |    ST     ST1
|        | D9 FE /7 |   | FSIN     |  ST
|        | D9 FF /7 |   | FCOS     |  ST
|        | DA /0    |   | FIADD    |   ST     m32int
|        | DA /0    |   | FCMOVB   |    ST     STi
|        | DA /1    |   | FIMUL    |   ST     m32int
|        | DA /1    |   | FCMOVE   |    ST     STi
|        | DA /2    |   | FICOM    |   ST     m32int
|        | DA /2    |   | FCMOVBE  |     ST     STi
|        | DA /3    |   | FICOMP   |    ST     m32int
|        | DA /3    |   | FCMOVU   |    ST     STi
|        | DA /4    |   | FISUB    |   ST     m32int
|        | DA /5    |   | FISUBR   |    ST     m32int
|        | DA E9 /5 |   | FUCOMPP  |     ST     ST1
|        | DA /6    |   | FIDIV    |   ST     m32int
|        | DA /7    |   | FIDIVR   |    ST     m32int
|        | DB /0    |   | FILD     |  ST     m32int
|        | DB /0    |   | FCMOVNB  |     ST     STi
|        | DB /1    |   | FISTTP   |    m32int     ST
|        | DB /1    |   | FCMOVNE  |     ST     STi
|        | DB /2    |   | FIST     |  m32int     ST
|        | DB /2    |   | FCMOVNBE |      ST     STi
|        | DB /3    |   | FISTP    |   m32int     ST
|        | DB /3    |   | FCMOVNU  |  ST     STi
|        | DB E0 /4 |   | FNENI    | nop
|        | DB E1 /4 |   | FNDISI   | nop
|        | DB E2 /4 |   | FNCLEX   |
| 9B     | DB E2 /4 |   | FCLEX    |
|        | DB E3 /4 |   | FNINIT   |
| 9B     | DB E3 /4 |   | FINIT    |
|        | DB E4 /4 |   | FNSETPM  |      nop
|        | DB /5    |   | FLD      |      ST     m80real
|        | DB /5    |   | FUCOMI   |     ST     STi
|        | DB /6    |   | FCOMI    |    ST     STi
|        | DB /7    |   | FSTP     |   m80real     ST
|        | DC /0    |   | FADD     |   ST     m64real
|        | DC /0    |   | FADD     |   STi     ST
|        | DC /1    |   | FMUL     |   ST     m64real
|        | DC /1    |   | FMUL     |   STi     ST
|        | DC /2    |   | FCOM     |   ST     m64real
|        | DC /2    |   | FCOM2    |    ST     STi
|        | DC /3    |   | FCOMP    |    ST     m64real
|        | DC /3    |   | FCOMP3   |     ST     STi
|        | DC /4    |   | FSUB     |   ST     m64real
|        | DC /4    |   | FSUBR    |    STi     ST
|        | DC /5    |   | FSUBR    |    ST     m64real
|        | DC /5    |   | FSUB     |   STi     ST
|        | DC /6    |   | FDIV     |   ST     m64real
|        | DC /6    |   | FDIVR    |    STi     ST
|        | DC /7    |   | FDIVR    |    ST     m64real
|        | DC /7    |   | FDIV     |   STi     ST
|        | DD /0    |   | FLD      |  ST     m64real
|        | DD /0    |   | FFREE    |    STi
|        | DD /1    |   | FISTTP   |     m64int     ST
|        | DD /1    |   | FXCH4    |    ST     STi
|        | DD /2    |   | FST      |  m64real     ST
|        | DD /2    |   | FST      |  ST     STi
|        | DD /3    |   | FSTP     |   m64real     ST
|        | DD /3    |   | FSTP     |   ST     STi
|        | DD /4    |   | FRSTOR   |     ST     ST1     ST2
|        | DD /4    |   | FUCOM    |    ST     STi
|        | DD E1    |   | FUCOM    |    ST     ST1
|        | DD /5    |   | FUCOMP   |     ST     STi
|        | DD E9 /5 |   | FUCOMP   |     ST     ST1
|        | DD /6    |   | FNSAVE   |     m94/108     ST     ST1
| 9B     | DD /6    |   | FSAVE    |    m94/108     ST     ST1
|        | DD /7    |   | FNSTSW   |     m16
| 9B     | DD /7    |   | FSTSW    |    m16
|        | DE /0    |   | FIADD    |         ST     m16int
|        | DE /0    |   | FADDP    |     STi     ST
|        | DE C1 /0 |   | FADDP    |     ST1     ST
|        | DE /1    |   | FIMUL    |     ST     m16int
|        | DE /1    |   | FMULP    |     STi     ST
|        | DE C9 /1 |   | FMULP    |     ST1     ST
|        | DE /2    |   | FICOM    |     ST     m16int
|        | DE /2    |   | FCOMP5   |      ST     STi
|        | DE /3    |   | FICOMP   |      ST     m16int
|        | DE D9 /3 |   | FCOMPP   |      ST     ST1
|        | DE /4    |   | FISUB    |     ST     m16int
|        | DE /4    |   | FSUBRP   |      STi     ST
|        | DE E1 /4 |   | FSUBRP   |      ST1     ST
|        | DE /5    |   | FISUBR   |      ST     m16int
|        | DE /5    |   | FSUBP    |     STi     ST
|        | DE E9 /5 |   | FSUBP    |     ST1     ST
|        | DE /     |   | FIDIV    |     ST     m16int
|        | DE /6    |   | FDIVRP   |      STi     ST
|        | DE F1 /6 |   | FDIVRP   |      ST1     ST
|        | DE /7    |   | FIDIVR   |      ST     m16int
|        | DE /7    |   | FDIVP    |     STi     ST
|        | DE F9 /7 |   | FDIVP    |     ST1     ST
|        | DF /0    |   | FILD     |    ST     m16int
|        | DF /0    |   | FFREEP   |      STi
|        | DF /1    |   | FISTTP   |      m16int     ST
|        | DF /1    |   | FXCH7    |     ST     STi
|        | DF /2    |   | FIST     |    m16int     ST
|        | DF /2    |   | FSTP8    |     STi     ST
|        | DF /3    |   | FISTP    |     m16int     ST
|        | DF /3    |   | FSTP9    |     STi     ST
|        | DF /4    |   | FBLD     |    ST     m80dec
|        | DF E0 /4 |   | FNSTSW   |      AX
| 9B     | DF E0 /4 |   | FSTSW    |     AX
|        | DF /5    |   | FILD     |    ST     m64int
|        | DF /5    |   | FUCOMIP  |       ST     STi
|        | DF /6    |   | FBSTP    |     m80dec     ST
|        | DF /6    |   | FCOMIP   |      ST     STi
|        | DF /7    |   | FISTP    |     m64int     ST
|        | E0       |   | LOOPNZ   |      eCX     rel8
|        |          |   | LOOPNE   |      eCX     rel8
|        | E1       |   | LOOPZ    |     eCX     rel8
|        |          |   | LOOPE    |     eCX     rel8
|        | E2       |   | LOOP     |    eCX     rel8
|        | E3       |   | JCXZ     |    rel8     CX
|        |          |   | JECXZ    |     rel8     ECX
|        | E4       |   | IN       |  AL     imm8
|        | E5       |   | IN       |  eAX     imm8
|        | E6       |   | OUT      |   imm8     AL
|        | E7       |   | OUT      |   imm8     eAX
|        | E8       |   | CALL     |    rel16/32
|        | E9       |   | JMP      |   rel16/32
|        | EA       |   | JMPF     |    ptr16:16/32
|        | EB       |   | JMP      |   rel8
|        | EC       |   | IN       |  AL     DX
|        | ED       |   | IN       |  eAX     DX
|        | EE       |   | OUT      |   DX     AL
|        | EF       |   | OUT      |   DX     eAX
|        | F1       |   | INT1     |    eFlags
|        |          |   | ICEBP    |     eFlags
|        | F4       |   | HLT      |
|        | F5       |   | CMC      |
|        | F6 /0    |   | TEST     |    r/m8     imm8
|        | F6 /1    |   | TEST     |    r/m8     imm8
|        | F6 /2    |   | NOT      |   r/m8
|        | F6 /3    |   | NEG      |    r/m8
|        | F6 /4    |   | MUL      |    AX     AL     r/m8
|        | F6 /5    |   | IMUL     |     AX     AL     r/m8
|        | F6 /6    |   | DIV      |    AL     AH     AX     r/m8
|        | F6 /7    |   | IDIV     |     AL     AH     AX     r/m8
|        | F7 /0    |   | TEST     |     r/m16/32     imm16/32
|        | F7 /1    |   | TEST     |     r/m16/32     imm16/32
|        | F7 /2    |   | NOT      |    r/m16/32
|        | F7 /3    |   | NEG      |    r/m16/32
|        | F7 /4    |   | MUL      |    eDX     eAX     r/m16/32
|        | F7 /5    |   | IMUL     |     eDX     eAX     r/m16/32
|        | F7 /6    |   | DIV      |    eDX     eAX     r/m16/32
|        | F7 /7    |   | IDIV     |     eDX     eAX     r/m16/32
|        | F8       |   | CLC      |
|        | F9       |   | STC      |
|        | FA       |   | CLI      |
|        | FB       |   | STI      |
|        | FC       |   | CLD      |
|        | FD       |   | STD      |
|        | FE /0    |   | INC      |    r/m8
|        | FE /1    |   | DEC      |    r/m8
|        | FF /0    |   | INC      |    r/m16/32
|        | FF /1    |   | DEC      |    r/m16/32
|        | FF /2    |   | CALL     |     r/m16/32
|        | FF /3    |   | CALLF    |      m16:16/32
|        | FF /4    |   | JMP      |    r/m16/32
|        | FF /5    |   | JMPF     |     m16:16/32
|        | FF /6    |   | PUSH     |     r/m16/32



````

### 2-byte instructions

````
     0F     00         0     02+         P             SLDT     m16     LDTR                                     Store Local Descriptor Table Register
SLDT     r16/32     LDTR
    0F     00         1     02+         P             STR     m16     TR                                     Store Task Register
STR     r16/32     TR
    0F     00         2     02+         P     0         LLDT     LDTR     r/m16                                     Load Local Descriptor Table Register
    0F     00         3     02+         P     0         LTR     TR     r/m16                                     Load Task Register
    0F     00         4     02+         P             VERR     r/m16                         ....z...     ....z...             Verify a Segment for Reading
    0F     00         5     02+         P             VERW     r/m16                         ....z...     ....z...             Verify a Segment for Writing
    0F     01         0     02+                     SGDT     m     GDTR                                     Store Global Descriptor Table Register
    0F     01     C1     0     P4++     D24     P     0         VMCALL                     vmx         o..szapc     o..szapc             Call to VM Monitor
    0F     01     C2     0     P4++     D24     P     0         VMLAUNCH                     vmx         o..szapc     o..szapc             Launch Virtual Machine
    0F     01     C3     0     P4++     D24     P     0         VMRESUME                     vmx         o..szapc     o..szapc             Resume Virtual Machine
    0F     01     C4     0     P4++     D24     P     0         VMXOFF                     vmx         o..szapc     o..szapc             Leave VMX Operation
    0F     01         1     02+                     SIDT     m     IDTR                                     Store Interrupt Descriptor Table Register
    0F     01     C8     1     P4++             0         MONITOR     m8     ECX     EDX         sse3                         Set Up Monitor Address
    0F     01     C9     1     P4++             0         MWAIT     EAX     ECX             sse3                         Monitor Wait
    0F     01         2     02+             0         LGDT     GDTR     m                                     Load Global Descriptor Table Register
    0F     01     D0     2     C2++                     XGETBV     EDX     EAX     ECX     XCR                             Get Value of Extended Control Register
    0F     01     D1     2     C2++             0         XSETBV     XCR     ECX     EDX     EAX                             Set Extended Control Register
    0F     01         3     02+             0         LIDT     IDTR     m                                     Load Interrupt Descriptor Table Register
    0F     01         4     02+     D13                 SMSW     m16     MSW                                     Store Machine Status Word
SMSW     r16/32     MSW
    0F     01         6     02+             0         LMSW     MSW     r/m16                                     Load Machine Status Word
    0F     01         7     04+             0         INVLPG     m                                         Invalidate TLB Entry
    0F     01     F9     7     C7+             f2         RDTSCP     EAX     EDX     ECX     ...                             Read Time-Stamp Counter and Processor ID
    0F     02         r     02+         P             LAR     r16/32     m16                     ....z...     ....z...             Load Access Rights Byte
LAR     r16/32     r16/32
    0F     03         r     02+         P             LSL     r16/32     m16                     ....z...     ....z...             Load Segment Limit
LSL     r16/32     r16/32
    0F     06             02+             0         CLTS     CR0                                         Clear Task-Switched Flag in CR0
    0F     08             04+             0         INVD                                             Invalidate Internal Caches
    0F     09             04+             0         WBINVD                                             Write Back and Invalidate Cache
    0F     0B             02+                     UD2                                             Undefined Instruction
    0F     0D             PP+     M14                 NOP     r/m16/32                                         No Operation
    0F     10         r     P3+                     MOVUPS     xmm     xmm/m128             sse1                         Move Unaligned Packed Single-FP Values
F3     0F     10         r     P3+                     MOVSS     xmm     xmm/m32             sse1                         Move Scalar Single-FP Values
66     0F     10         r     P4+                     MOVUPD     xmm     xmm/m128             sse2                         Move Unaligned Packed Double-FP Value
F2     0F     10         r     P4+                     MOVSD     xmm     xmm/m64             sse2                         Move Scalar Double-FP Value
    0F     11         r     P3+                     MOVUPS     xmm/m128     xmm             sse1                         Move Unaligned Packed Single-FP Values
F3     0F     11         r     P3+                     MOVSS     xmm/m32     xmm             sse1                         Move Scalar Single-FP Values
66     0F     11         r     P4+                     MOVUPD     xmm/m128     xmm             sse2                         Move Unaligned Packed Double-FP Values
F2     0F     11         r     P4+                     MOVSD     xmm/m64     xmm             sse2                         Move Scalar Double-FP Value
    0F     12         r     P3+                     MOVHLPS     xmm     xmm             sse1                         Move Packed Single-FP Values High to Low
    0F     12         r     P3+                     MOVLPS     xmm     m64             sse1                         Move Low Packed Single-FP Values
66     0F     12         r     P4+                     MOVLPD     xmm     m64             sse2                         Move Low Packed Double-FP Value
F2     0F     12         r     P4++                     MOVDDUP     xmm     xmm/m64             sse3                         Move One Double-FP and Duplicate
F3     0F     12         r     P4++                     MOVSLDUP     xmm     xmm/m64             sse3                         Move Packed Single-FP Low and Duplicate
    0F     13         r     P3+                     MOVLPS     m64     xmm             sse1                         Move Low Packed Single-FP Values
66     0F     13         r     P4+                     MOVLPD     m64     xmm             sse2                         Move Low Packed Double-FP Value
    0F     14         r     P3+                     UNPCKLPS     xmm     xmm/m64             sse1                         Unpack and Interleave Low Packed Single-FP Values
66     0F     14         r     P4+                     UNPCKLPD     xmm     xmm/m128             sse2                         Unpack and Interleave Low Packed Double-FP Values
    0F     15         r     P3+                     UNPCKHPS     xmm     xmm/m64             sse1                         Unpack and Interleave High Packed Single-FP Values
66     0F     15         r     P4+                     UNPCKHPD     xmm     xmm/m128             sse2                         Unpack and Interleave High Packed Double-FP Values
    0F     16         r     P3+                     MOVLHPS     xmm     xmm             sse1                         Move Packed Single-FP Values Low to High
    0F     16         r     P3+                     MOVHPS     xmm     m64             sse1                         Move High Packed Single-FP Values
66     0F     16         r     P4+                     MOVHPD     xmm     m64             sse2                         Move High Packed Double-FP Value
F3     0F     16         r     P4++                     MOVSHDUP     xmm     xmm/m64             sse3                         Move Packed Single-FP High and Duplicate
    0F     17         r     P3+                     MOVHPS     m64     xmm             sse1                         Move High Packed Single-FP Values
66     0F     17         r     P4+                     MOVHPD     m64     xmm             sse2                         Move High Packed Double-FP Value
    0F     18         0     P3+                     PREFETCHNTA     m8                 sse1                         Prefetch Data Into Caches
    0F     18         1     P3+                     PREFETCHT0     m8                 sse1                         Prefetch Data Into Caches
    0F     18         2     P3+                     PREFETCHT1     m8                 sse1                         Prefetch Data Into Caches
    0F     18         3     P3+                     PREFETCHT2     m8                 sse1                         Prefetch Data Into Caches
    0F     18         4     PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     18         5     PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     18         6     PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     18         7     PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     19             PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     1A             PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     1B             PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     1C             PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     1D             PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     1E             PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     1F         0     P4++                     NOP     r/m16/32                                         No Operation
    0F     1F         1     PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     1F         2     PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     1F         3     PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     1F         4     PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     1F         5     PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     1F         6     PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     1F         7     PP+     M15                 HINT_NOP     r/m16/32                                         Hintable NOP
    0F     20         r     03+             0         MOV     r32     CRn                     o..szapc         o..szapc         Move to/from Control Registers
    0F     20         r     03+     U16         0         MOV     r32     CRn                     o..szapc         o..szapc         Move to/from Control Registers
    0F     21         r     03+             0         MOV     r32     DRn                     o..szapc         o..szapc         Move to/from Debug Registers
    0F     21         r     03+     U16         0         MOV     r32     DRn                     o..szapc         o..szapc         Move to/from Debug Registers
    0F     22         r     03+             0         MOV     CRn     r32                     o..szapc         o..szapc         Move to/from Control Registers
    0F     22         r     03+     U16         0         MOV     CRn     r32                     o..szapc         o..szapc         Move to/from Control Registers
    0F     23         r     03+             0         MOV     DRn     r32                     o..szapc         o..szapc         Move to/from Debug Registers
    0F     23         r     03+     U16         0         MOV     DRn     r64                     o..szapc         o..szapc         Move to/from Debug Registers
    0F     28         r     P3+                     MOVAPS     xmm     xmm/m128             sse1                         Move Aligned Packed Single-FP Values
66     0F     28         r     P4+                     MOVAPD     xmm     xmm/m128             sse2                         Move Aligned Packed Double-FP Values
    0F     29         r     P3+                     MOVAPS     xmm/m128     xmm             sse1                         Move Aligned Packed Single-FP Values
66     0F     29         r     P4+                     MOVAPD     xmm/m128     xmm             sse2                         Move Aligned Packed Double-FP Values
    0F     2A         r     P3+                     CVTPI2PS     xmm     mm/m64             sse1                         Convert Packed DW Integers to Single-FP Values
F3     0F     2A         r     P3+                     CVTSI2SS     xmm     r/m32             sse1                         Convert DW Integer to Scalar Single-FP Value
66     0F     2A         r     P4+                     CVTPI2PD     xmm     mm/m64             sse2                         Convert Packed DW Integers to Double-FP Values
F2     0F     2A         r     P4+                     CVTSI2SD     xmm     r/m32             sse2                         Convert DW Integer to Scalar Double-FP Value
    0F     2B         r     P3+                     MOVNTPS     m128     xmm             sse1                         Store Packed Single-FP Values Using Non-Temporal Hint
66     0F     2B         r     P4+                     MOVNTPD     m128     xmm             sse2                         Store Packed Double-FP Values Using Non-Temporal Hint
    0F     2C         r     P3+                     CVTTPS2PI     mm     xmm/m64             sse1                         Convert with Trunc. Packed Single-FP Values to DW Integers
F3     0F     2C         r     P3+                     CVTTSS2SI     r32     xmm/m32             sse1                         Convert with Trunc. Scalar Single-FP Value to DW Integer
66     0F     2C         r     P4+                     CVTTPD2PI     mm     xmm/m128             sse2                         Convert with Trunc. Packed Double-FP Values to DW Integers
F2     0F     2C         r     P4+                     CVTTSD2SI     r32     xmm/m64             sse2                         Conv. with Trunc. Scalar Double-FP Value to Signed DW Int
    0F     2D         r     P3+                     CVTPS2PI     mm     xmm/m64             sse1                         Convert Packed Single-FP Values to DW Integers
F3     0F     2D         r     P3+                     CVTSS2SI     r32     xmm/m32             sse1                         Convert Scalar Single-FP Value to DW Integer
66     0F     2D         r     P4+                     CVTPD2PI     mm     xmm/m128             sse2                         Convert Packed Double-FP Values to DW Integers
F2     0F     2D         r     P4+                     CVTSD2SI     r32     xmm/m64             sse2                         Convert Scalar Double-FP Value to DW Integer
    0F     2E         r     P3+                     UCOMISS     xmm     xmm/m32             sse1         ....z.pc     ....z.pc             Unordered Compare Scalar Single-FP Values and Set EFLAGS
66     0F     2E         r     P4+                     UCOMISD     xmm     xmm/m64             sse2         ....z.pc     ....z.pc             Unordered Compare Scalar Double-FP Values and Set EFLAGS
    0F     2F         r     P3+                     COMISS     xmm     xmm/m32             sse1         ....z.pc     ....z.pc             Compare Scalar Ordered Single-FP Values and Set EFLAGS
66     0F     2F         r     P4+                     COMISD     xmm     xmm/m64             sse2         ....z.pc     ....z.pc             Compare Scalar Ordered Double-FP Values and Set EFLAGS
    0F     30             P1+             0         WRMSR     MSR     ECX     EAX     EDX                             Write to Model Specific Register
    0F     31             P1+             f2         RDTSC     EAX     EDX     IA32_TIM…                                 Read Time-Stamp Counter
    0F     32             P1+             0         RDMSR     EAX     EDX     ECX     MSR                             Read from Model Specific Register
    0F     33             PX+             f3         RDPMC     EAX     EDX     PMC                                 Read Performance-Monitoring Counters
    0F     34             P2+         P             SYSENTER     SS     ESP     IA32_SYS…     ...             ..i.....     ..i.....         ..i.....     Fast System Call
    0F     35             P2+         P     0         SYSEXIT     SS     eSP     IA32_SYS…     ...                             Fast Return from Fast System Call
    0F     37             C2++     D17                 GETSEC     EAX                 smx                         GETSEC Leaf Functions
    0F     38     00     r     C2+                     PSHUFB     mm     mm/m64             ssse3                         Packed Shuffle Bytes
66     0F     38     00     r     C2+                     PSHUFB     xmm     xmm/m128             ssse3                         Packed Shuffle Bytes
    0F     38     01     r     C2+                     PHADDW     mm     mm/m64             ssse3                         Packed Horizontal Add
66     0F     38     01     r     C2+                     PHADDW     xmm     xmm/m128             ssse3                         Packed Horizontal Add
    0F     38     02     r     C2+                     PHADDD     mm     mm/m64             ssse3                         Packed Horizontal Add
66     0F     38     02     r     C2+                     PHADDD     xmm     xmm/m128             ssse3                         Packed Horizontal Add
    0F     38     03     r     C2+                     PHADDSW     mm     mm/m64             ssse3                         Packed Horizontal Add and Saturate
66     0F     38     03     r     C2+                     PHADDSW     xmm     xmm/m128             ssse3                         Packed Horizontal Add and Saturate
    0F     38     04     r     C2+                     PMADDUBSW     mm     mm/m64             ssse3                         Multiply and Add Packed Signed and Unsigned Bytes
66     0F     38     04     r     C2+                     PMADDUBSW     xmm     xmm/m128             ssse3                         Multiply and Add Packed Signed and Unsigned Bytes
    0F     38     05     r     C2+                     PHSUBW     mm     mm/m64             ssse3                         Packed Horizontal Subtract
66     0F     38     05     r     C2+                     PHSUBW     xmm     xmm/m128             ssse3                         Packed Horizontal Subtract
    0F     38     06     r     C2+                     PHSUBD     mm     mm/m64             ssse3                         Packed Horizontal Subtract
66     0F     38     06     r     C2+                     PHSUBD     xmm     xmm/m128             ssse3                         Packed Horizontal Subtract
    0F     38     07     r     C2+                     PHSUBSW     mm     mm/m64             ssse3                         Packed Horizontal Subtract and Saturate
66     0F     38     07     r     C2+                     PHSUBSW     xmm     xmm/m128             ssse3                         Packed Horizontal Subtract and Saturate
    0F     38     08     r     C2+                     PSIGNB     mm     mm/m64             ssse3                         Packed SIGN
66     0F     38     08     r     C2+                     PSIGNB     xmm     xmm/m128             ssse3                         Packed SIGN
    0F     38     09     r     C2+                     PSIGNW     mm     mm/m64             ssse3                         Packed SIGN
66     0F     38     09     r     C2+                     PSIGNW     xmm     xmm/m128             ssse3                         Packed SIGN
    0F     38     0A     r     C2+                     PSIGND     mm     mm/m64             ssse3                         Packed SIGN
66     0F     38     0A     r     C2+                     PSIGND     xmm     xmm/m128             ssse3                         Packed SIGN
    0F     38     0B     r     C2+                     PMULHRSW     mm     mm/m64             ssse3                         Packed Multiply High with Round and Scale
66     0F     38     0B     r     C2+                     PMULHRSW     xmm     xmm/m128             ssse3                         Packed Multiply High with Round and Scale
66     0F     38     10     r     C2++     D25                 PBLENDVB     xmm     xmm/m128     XMM0         sse41                         Variable Blend Packed Bytes
66     0F     38     14     r     C2++     D25                 BLENDVPS     xmm     xmm/m128     XMM0         sse41                         Variable Blend Packed Single-FP Values
66     0F     38     15     r     C2++     D25                 BLENDVPD     xmm     xmm/m128     XMM0         sse41                         Variable Blend Packed Double-FP Values
66     0F     38     17     r     C2++     D25                 PTEST     xmm     xmm/m128             sse41         o..szapc     o..szapc         o..s.ap.     Logical Compare
    0F     38     1C     r     C2+                     PABSB     mm     mm/m64             ssse3                         Packed Absolute Value
66     0F     38     1C     r     C2+                     PABSB     xmm     xmm/m128             ssse3                         Packed Absolute Value
    0F     38     1D     r     C2+                     PABSW     mm     mm/m64             ssse3                         Packed Absolute Value
66     0F     38     1D     r     C2+                     PABSW     xmm     xmm/m128             ssse3                         Packed Absolute Value
    0F     38     1E     r     C2+                     PABSD     mm     mm/m64             ssse3                         Packed Absolute Value
66     0F     38     1E     r     C2+                     PABSD     xmm     xmm/m128             ssse3                         Packed Absolute Value
66     0F     38     20     r     C2++     D25                 PMOVSXBW     xmm     m64             sse41                         Packed Move with Sign Extend
PMOVSXBW     xmm     xmm
66     0F     38     21     r     C2++     D25                 PMOVSXBD     xmm     m32             sse41                         Packed Move with Sign Extend
PMOVSXBD     xmm     xmm
66     0F     38     22     r     C2++     D25                 PMOVSXBQ     xmm     m16             sse41                         Packed Move with Sign Extend
PMOVSXBQ     xmm     xmm
66     0F     38     23     r     C2++     D25                 PMOVSXWD     xmm     m64             sse41                         Packed Move with Sign Extend
PMOVSXWD     xmm     xmm
66     0F     38     24     r     C2++     D25                 PMOVSXWQ     xmm     m32             sse41                         Packed Move with Sign Extend
PMOVSXWQ     xmm     xmm
66     0F     38     25     r     C2++     D25                 PMOVSXDQ     xmm     m64             sse41                         Packed Move with Sign Extend
PMOVSXDQ     xmm     xmm
66     0F     38     28     r     C2++     D25                 PMULDQ     xmm     xmm/m128             sse41                         Multiply Packed Signed Dword Integers
66     0F     38     29     r     C2++     D25                 PCMPEQQ     xmm     xmm/m128             sse41                         Compare Packed Qword Data for Equal
66     0F     38     2A     r     C2++     D25                 MOVNTDQA     xmm     m128             sse41                         Load Double Quadword Non-Temporal Aligned Hint
66     0F     38     2B     r     C2++     D25                 PACKUSDW     xmm     xmm/m128             sse41                         Pack with Unsigned Saturation
66     0F     38     30     r     C2++     D25                 PMOVZXBW     xmm     m64             sse41                         Packed Move with Zero Extend
PMOVZXBW     xmm     xmm
66     0F     38     31     r     C2++     D25                 PMOVZXBD     xmm     m32             sse41                         Packed Move with Zero Extend
PMOVZXBD     xmm     xmm
66     0F     38     32     r     C2++     D25                 PMOVZXBQ     xmm     m16             sse41                         Packed Move with Zero Extend
PMOVZXBQ     xmm     xmm
66     0F     38     33     r     C2++     D25                 PMOVZXWD     xmm     m64             sse41                         Packed Move with Zero Extend
PMOVZXWD     xmm     xmm
66     0F     38     34     r     C2++     D25                 PMOVZXWQ     xmm     m32             sse41                         Packed Move with Zero Extend
PMOVZXWQ     xmm     xmm
66     0F     38     35     r     C2++     D25                 PMOVZXDQ     xmm     m64             sse41                         Packed Move with Zero Extend
PMOVZXDQ     xmm     xmm
66     0F     38     37     r     C2++     D25                 PCMPGTQ     xmm     xmm/m128             sse42                         Compare Packed Qword Data for Greater Than
66     0F     38     38     r     C2++     D25                 PMINSB     xmm     xmm/m128             sse41                         Minimum of Packed Signed Byte Integers
66     0F     38     39     r     C2++     D25                 PMINSD     xmm     xmm/m128             sse41                         Minimum of Packed Signed Dword Integers
66     0F     38     3A     r     C2++     D25                 PMINUW     xmm     xmm/m128             sse41                         Minimum of Packed Unsigned Word Integers
66     0F     38     3B     r     C2++     D25                 PMINUD     xmm     xmm/m128             sse41                         Minimum of Packed Unsigned Dword Integers
66     0F     38     3C     r     C2++     D25                 PMAXSB     xmm     xmm/m128             sse41                         Maximum of Packed Signed Byte Integers
66     0F     38     3D     r     C2++     D25                 PMAXSD     xmm     xmm/m128             sse41                         Maximum of Packed Signed Dword Integers
66     0F     38     3E     r     C2++     D25                 PMAXUW     xmm     xmm/m128             sse41                         Maximum of Packed Unsigned Word Integers
66     0F     38     3F     r     C2++     D25                 PMAXUD     xmm     xmm/m128             sse41                         Maximum of Packed Unsigned Dword Integers
66     0F     38     40     r     C2++     D25                 PMULLD     xmm     xmm/m128             sse41                         Multiply Packed Signed Dword Integers and Store Low Result
66     0F     38     41     r     C2++     D25                 PHMINPOSUW     xmm     xmm/m128             sse41                         Packed Horizontal Word Minimum
66     0F     38     80     r     C2++     D24     P     0         INVEPT     r32     m128             vmx         o..szapc     o..szapc             Invalidate Translations Derived from EPT
66     0F     38     81     r     C2++     D24     P     0         INVVPID     r32     m128             vmx         o..szapc     o..szapc             Invalidate Translations Based on VPID
    0F     38     F0     r     C2++                     MOVBE     r16/32     m16/32                                     Move Data After Swapping Bytes
F2     0F     38     F0     r     C2++     D25                 CRC32     r32     r/m8             sse42                         Accumulate CRC32 Value
    0F     38     F1     r     C2++                     MOVBE     m16/32     r16/32                                     Move Data After Swapping Bytes
F2     0F     38     F1     r     C2++     D25                 CRC32     r32     r/m16/32             sse42                         Accumulate CRC32 Value
66     0F     3A     08     r     C2++     D25                 ROUNDPS     xmm     xmm/m128     imm8         sse41                         Round Packed Single-FP Values
66     0F     3A     09     r     C2++     D25                 ROUNDPD     xmm     xmm/m128     imm8         sse41                         Round Packed Double-FP Values
66     0F     3A     0A     r     C2++     D25                 ROUNDSS     xmm     xmm/m32     imm8         sse41                         Round Scalar Single-FP Values
66     0F     3A     0B     r     C2++     D25                 ROUNDSD     xmm     xmm/m64     imm8         sse41                         Round Scalar Double-FP Values
66     0F     3A     0C     r     C2++     D25                 BLENDPS     xmm     xmm/m128     imm8         sse41                         Blend Packed Single-FP Values
66     0F     3A     0D     r     C2++     D25                 BLENDPD     xmm     xmm/m128     imm8         sse41                         Blend Packed Double-FP Values
66     0F     3A     0E     r     C2++     D25                 PBLENDW     xmm     xmm/m128     imm8         sse41                         Blend Packed Words
    0F     3A     0F     r     C2+                     PALIGNR     mm     mm/m64             ssse3                         Packed Align Right
66     0F     3A     0F     r     C2+                     PALIGNR     xmm     xmm/m128             ssse3                         Packed Align Right
66     0F     3A     14     r     C2++     D25                 PEXTRB     m8     xmm     imm8         sse41                         Extract Byte
PEXTRB     r32     xmm     imm8
66     0F     3A     15     r     C2++     D25                 PEXTRW     m16     xmm     imm8         sse41                         Extract Word
PEXTRW     r32     xmm     imm8
66     0F     3A     16     r     C2++     D25                 PEXTRD     r/m32     xmm     imm8         sse41                         Extract Dword/Qword
PEXTRQ     r/m64     xmm     imm8
66     0F     3A     17     r     C2++     D25                 EXTRACTPS     r/m32     xmm     imm8         sse41                         Extract Packed Single-FP Value
66     0F     3A     20     r     C2++     D25                 PINSRB     xmm     m8     imm8         sse41                         Insert Byte
PINSRB     xmm     r32     imm8
66     0F     3A     21     r     C2++     D25                 INSERTPS     xmm     xmm     imm8         sse41                         Insert Packed Single-FP Value
INSERTPS     xmm     m32     imm8
66     0F     3A     22     r     C2++     D25                 PINSRD     xmm     r/m32     imm8         sse41                         Insert Dword/Qword
PINSRQ     xmm     r/m64     imm8
66     0F     3A     40     r     C2++     D25                 DPPS     xmm     xmm/m128             sse41                         Dot Product of Packed Single-FP Values
66     0F     3A     41     r     C2++     D25                 DPPD     xmm     xmm/m128             sse41                         Dot Product of Packed Double-FP Values
66     0F     3A     42     r     C2++     D25                 MPSADBW     xmm     xmm/m128     imm8         sse41                         Compute Multiple Packed Sums of Absolute Difference
66     0F     3A     60     r     C2++     D25                 PCMPESTRM     XMM0     xmm     xmm/m128     ...     sse42         o..szapc     o..szapc         .....ap.     Packed Compare Explicit Length Strings, Return Mask
66     0F     3A     61     r     C2++     D25                 PCMPESTRI     ECX     xmm     xmm/m128     ...     sse42         o..szapc     o..szapc         .....ap.     Packed Compare Explicit Length Strings, Return Index
66     0F     3A     62     r     C2++     D25                 PCMPISTRM     XMM0     xmm     xmm/m128     imm8     sse42         o..szapc     o..szapc         .....ap.     Packed Compare Implicit Length Strings, Return Mask
66     0F     3A     63     r     C2++     D25                 PCMPISTRI     ECX     xmm     xmm/m128     imm8     sse42         o..szapc     o..szapc         .....ap.     Packed Compare Implicit Length Strings, Return Index
    0F     40         r     PP+                     CMOVO     r16/32     r/m16/32                 o.......                     Conditional Move - overflow (OF=1)
    0F     41         r     PP+                     CMOVNO     r16/32     r/m16/32                 o.......                     Conditional Move - not overflow (OF=0)
    0F     42         r     PP+                     CMOVB     r16/32     r/m16/32                 .......c                     Conditional Move - below/not above or equal/carry (CF=1)
CMOVNAE     r16/32     r/m16/32
CMOVC     r16/32     r/m16/32
    0F     43         r     PP+                     CMOVNB     r16/32     r/m16/32                 .......c                     Conditional Move - not below/above or equal/not carry (CF=0)
CMOVAE     r16/32     r/m16/32
CMOVNC     r16/32     r/m16/32
    0F     44         r     PP+                     CMOVZ     r16/32     r/m16/32                 ....z...                     Conditional Move - zero/equal (ZF=0)
CMOVE     r16/32     r/m16/32
    0F     45         r     PP+                     CMOVNZ     r16/32     r/m16/32                 ....z...                     Conditional Move - not zero/not equal (ZF=1)
CMOVNE     r16/32     r/m16/32
    0F     46         r     PP+                     CMOVBE     r16/32     r/m16/32                 ....z..c                     Conditional Move - below or equal/not above (CF=1 AND ZF=1)
CMOVNA     r16/32     r/m16/32
    0F     47         r     PP+                     CMOVNBE     r16/32     r/m16/32                 ....z..c                     Conditional Move - not below or equal/above (CF=0 AND ZF=0)
CMOVA     r16/32     r/m16/32
    0F     48         r     PP+                     CMOVS     r16/32     r/m16/32                 ...s....                     Conditional Move - sign (SF=1)
    0F     49         r     PP+                     CMOVNS     r16/32     r/m16/32                 ...s....                     Conditional Move - not sign (SF=0)
    0F     4A         r     PP+                     CMOVP     r16/32     r/m16/32                 ......p.                     Conditional Move - parity/parity even (PF=1)
CMOVPE     r16/32     r/m16/32
    0F     4B         r     PP+                     CMOVNP     r16/32     r/m16/32                 ......p.                     Conditional Move - not parity/parity odd
CMOVPO     r16/32     r/m16/32
    0F     4C         r     PP+                     CMOVL     r16/32     r/m16/32                 o..s....                     Conditional Move - less/not greater (SF!=OF)
CMOVNGE     r16/32     r/m16/32
    0F     4D         r     PP+                     CMOVNL     r16/32     r/m16/32                 o..s....                     Conditional Move - not less/greater or equal (SF=OF)
CMOVGE     r16/32     r/m16/32
    0F     4E         r     PP+                     CMOVLE     r16/32     r/m16/32                 o..sz...                     Conditional Move - less or equal/not greater ((ZF=1) OR (SF!=OF))
CMOVNG     r16/32     r/m16/32
    0F     4F         r     PP+                     CMOVNLE     r16/32     r/m16/32                 o..sz...                     Conditional Move - not less nor equal/greater ((ZF=0) AND (SF=OF))
CMOVG     r16/32     r/m16/32
    0F     50         r     P3+                     MOVMSKPS     r32     xmm             sse1                         Extract Packed Single-FP Sign Mask
66     0F     50         r     P4+                     MOVMSKPD     r32     xmm             sse2                         Extract Packed Double-FP Sign Mask
    0F     51         r     P3+                     SQRTPS     xmm     xmm/m128             sse1                         Compute Square Roots of Packed Single-FP Values
F3     0F     51         r     P3+                     SQRTSS     xmm     xmm/m32             sse1                         Compute Square Root of Scalar Single-FP Value
66     0F     51         r     P4+                     SQRTPD     xmm     xmm/m128             sse2                         Compute Square Roots of Packed Double-FP Values
F2     0F     51         r     P4+                     SQRTSD     xmm     xmm/m64             sse2                         Compute Square Root of Scalar Double-FP Value
    0F     52         r     P3+                     RSQRTPS     xmm     xmm/m128             sse1                         Compute Recipr. of Square Roots of Packed Single-FP Values
F3     0F     52         r     P3+                     RSQRTSS     xmm     xmm/m32             sse1                         Compute Recipr. of Square Root of Scalar Single-FP Value
    0F     53         r     P3+                     RCPPS     xmm     xmm/m128             sse1                         Compute Reciprocals of Packed Single-FP Values
F3     0F     53         r     P3+                     RCPSS     xmm     xmm/m32             sse1                         Compute Reciprocal of Scalar Single-FP Values
    0F     54         r     P3+                     ANDPS     xmm     xmm/m128             sse1                         Bitwise Logical AND of Packed Single-FP Values
66     0F     54         r     P4+                     ANDPD     xmm     xmm/m128             sse2                         Bitwise Logical AND of Packed Double-FP Values
    0F     55         r     P3+                     ANDNPS     xmm     xmm/m128             sse1                         Bitwise Logical AND NOT of Packed Single-FP Values
66     0F     55         r     P4+                     ANDNPD     xmm     xmm/m128             sse2                         Bitwise Logical AND NOT of Packed Double-FP Values
    0F     56         r     P3+                     ORPS     xmm     xmm/m128             sse1                         Bitwise Logical OR of Single-FP Values
66     0F     56         r     P4+                     ORPD     xmm     xmm/m128             sse2                         Bitwise Logical OR of Double-FP Values
    0F     57         r     P3+                     XORPS     xmm     xmm/m128             sse1                         Bitwise Logical XOR for Single-FP Values
66     0F     57         r     P4+                     XORPD     xmm     xmm/m128             sse2                         Bitwise Logical XOR for Double-FP Values
    0F     58         r     P3+                     ADDPS     xmm     xmm/m128             sse1                         Add Packed Single-FP Values
F3     0F     58         r     P3+                     ADDSS     xmm     xmm/m32             sse1                         Add Scalar Single-FP Values
66     0F     58         r     P4+                     ADDPD     xmm     xmm/m128             sse2                         Add Packed Double-FP Values
F2     0F     58         r     P4+                     ADDSD     xmm     xmm/m64             sse2                         Add Scalar Double-FP Values
    0F     59         r     P3+                     MULPS     xmm     xmm/m128             sse1                         Multiply Packed Single-FP Values
F3     0F     59         r     P3+                     MULSS     xmm     xmm/m32             sse1                         Multiply Scalar Single-FP Value
66     0F     59         r     P4+                     MULPD     xmm     xmm/m128             sse2                         Multiply Packed Double-FP Values
F2     0F     59         r     P4+                     MULSD     xmm     xmm/m64             sse2                         Multiply Scalar Double-FP Values
    0F     5A         r     P4+                     CVTPS2PD     xmm     xmm/m128             sse2                         Convert Packed Single-FP Values to Double-FP Values
66     0F     5A         r     P4+                     CVTPD2PS     xmm     xmm/m128             sse2                         Convert Packed Double-FP Values to Single-FP Values
F3     0F     5A         r     P4+                     CVTSS2SD     xmm     xmm/m32             sse2                         Convert Scalar Single-FP Value to Scalar Double-FP Value
F2     0F     5A         r     P4+                     CVTSD2SS     xmm     xmm/m64             sse2                         Convert Scalar Double-FP Value to Scalar Single-FP Value
    0F     5B         r     P4+                     CVTDQ2PS     xmm     xmm/m128             sse2                         Convert Packed DW Integers to Single-FP Values
66     0F     5B         r     P4+                     CVTPS2DQ     xmm     xmm/m128             sse2                         Convert Packed Single-FP Values to DW Integers
F3     0F     5B         r     P4+                     CVTTPS2DQ     xmm     xmm/m128             sse2                         Convert with Trunc. Packed Single-FP Values to DW Integers
    0F     5C         r     P3+                     SUBPS     xmm     xmm/m128             sse1                         Subtract Packed Single-FP Values
F3     0F     5C         r     P3+                     SUBSS     xmm     xmm/m32             sse1                         Subtract Scalar Single-FP Values
66     0F     5C         r     P4+                     SUBPD     xmm     xmm/m128             sse2                         Subtract Packed Double-FP Values
F2     0F     5C         r     P4+                     SUBSD     xmm     xmm/m64             sse2                         Subtract Scalar Double-FP Values
    0F     5D         r     P3+                     MINPS     xmm     xmm/m128             sse1                         Return Minimum Packed Single-FP Values
F3     0F     5D         r     P3+                     MINSS     xmm     xmm/m32             sse1                         Return Minimum Scalar Single-FP Value
66     0F     5D         r     P4+                     MINPD     xmm     xmm/m128             sse2                         Return Minimum Packed Double-FP Values
F2     0F     5D         r     P4+                     MINSD     xmm     xmm/m64             sse2                         Return Minimum Scalar Double-FP Value
    0F     5E         r     P3+                     DIVPS     xmm     xmm/m128             sse1                         Divide Packed Single-FP Values
F3     0F     5E         r     P3+                     DIVSS     xmm     xmm/m32             sse1                         Divide Scalar Single-FP Values
66     0F     5E         r     P4+                     DIVPD     xmm     xmm/m128             sse2                         Divide Packed Double-FP Values
F2     0F     5E         r     P4+                     DIVSD     xmm     xmm/m64             sse2                         Divide Scalar Double-FP Values
    0F     5F         r     P3+                     MAXPS     xmm     xmm/m128             sse1                         Return Maximum Packed Single-FP Values
F3     0F     5F         r     P3+                     MAXSS     xmm     xmm/m32             sse1                         Return Maximum Scalar Single-FP Value
66     0F     5F         r     P4+                     MAXPD     xmm     xmm/m128             sse2                         Return Maximum Packed Double-FP Values
F2     0F     5F         r     P4+                     MAXSD     xmm     xmm/m64             sse2                         Return Maximum Scalar Double-FP Value
    0F     60         r     PX+                     PUNPCKLBW     mm     mm/m64             mmx                         Unpack Low Data
66     0F     60         r     P4+                     PUNPCKLBW     xmm     xmm/m128             sse2                         Unpack Low Data
    0F     61         r     PX+                     PUNPCKLWD     mm     mm/m64             mmx                         Unpack Low Data
66     0F     61         r     P4+                     PUNPCKLWD     xmm     xmm/m128             sse2                         Unpack Low Data
    0F     62         r     PX+                     PUNPCKLDQ     mm     mm/m64             mmx                         Unpack Low Data
66     0F     62         r     P4+                     PUNPCKLDQ     xmm     xmm/m128             sse2                         Unpack Low Data
    0F     63         r     PX+                     PACKSSWB     mm     mm/m64             mmx                         Pack with Signed Saturation
66     0F     63         r     P4+                     PACKSSWB     xmm     xmm/m128             sse2                         Pack with Signed Saturation
    0F     64         r     PX+                     PCMPGTB     mm     mm/m64             mmx                         Compare Packed Signed Integers for Greater Than
66     0F     64         r     P4+                     PCMPGTB     xmm     xmm/m128             sse2                         Compare Packed Signed Integers for Greater Than
    0F     65         r     PX+                     PCMPGTW     mm     mm/m64             mmx                         Compare Packed Signed Integers for Greater Than
66     0F     65         r     P4+                     PCMPGTW     xmm     xmm/m128             sse2                         Compare Packed Signed Integers for Greater Than
    0F     66         r     PX+                     PCMPGTD     mm     mm/m64             mmx                         Compare Packed Signed Integers for Greater Than
66     0F     66         r     P4+                     PCMPGTD     xmm     xmm/m128             sse2                         Compare Packed Signed Integers for Greater Than
    0F     67         r     PX+                     PACKUSWB     mm     mm/m64             mmx                         Pack with Unsigned Saturation
66     0F     67         r     P4+                     PACKUSWB     xmm     xmm/m128             sse2                         Pack with Unsigned Saturation
    0F     68         r     PX+                     PUNPCKHBW     mm     mm/m64             mmx                         Unpack High Data
66     0F     68         r     P4+                     PUNPCKHBW     xmm     xmm/m128             sse2                         Unpack High Data
    0F     69         r     PX+                     PUNPCKHWD     mm     mm/m64             mmx                         Unpack High Data
66     0F     69         r     P4+                     PUNPCKHWD     xmm     xmm/m128             sse2                         Unpack High Data
    0F     6A         r     PX+                     PUNPCKHDQ     mm     mm/m64             mmx                         Unpack High Data
66     0F     6A         r     P4+                     PUNPCKHDQ     xmm     xmm/m128             sse2                         Unpack High Data
    0F     6B         r     PX+                     PACKSSDW     mm     mm/m64             mmx                         Pack with Signed Saturation
66     0F     6B         r     P4+                     PACKSSDW     xmm     xmm/m128             sse2                         Pack with Signed Saturation
66     0F     6C         r     P4+                     PUNPCKLQDQ     xmm     xmm/m128             sse2                         Unpack Low Data
66     0F     6D         r     P4+                     PUNPCKHQDQ     xmm     xmm/m128             sse2                         Unpack High Data
    0F     6E         r     PX+                     MOVD     mm     r/m32             mmx                         Move Doubleword
66     0F     6E         r     P4+                     MOVD     xmm     r/m32             sse2                         Move Doubleword
    0F     6F         r     PX+                     MOVQ     mm     mm/m64             mmx                         Move Quadword
66     0F     6F         r     P4+                     MOVDQA     xmm     xmm/m128             sse2                         Move Aligned Double Quadword
F3     0F     6F         r     P4+                     MOVDQU     xmm     xmm/m128             sse2                         Move Unaligned Double Quadword
    0F     70         r     P3+                     PSHUFW     mm     mm/m64     imm8         sse1                         Shuffle Packed Words
F2     0F     70         r     P4+                     PSHUFLW     xmm     xmm/m128     imm8         sse2                         Shuffle Packed Low Words
F3     0F     70         r     P4+                     PSHUFHW     xmm     xmm/m128     imm8         sse2                         Shuffle Packed High Words
66     0F     70         r     P4+                     PSHUFD     xmm     xmm/m128     imm8         sse2                         Shuffle Packed Doublewords
    0F     71         2     PX+                     PSRLW     mm     imm8             mmx                         Shift Packed Data Right Logical
66     0F     71         2     P4+                     PSRLW     xmm     imm8             sse2                         Shift Packed Data Right Logical
    0F     71         4     PX+                     PSRAW     mm     imm8             mmx                         Shift Packed Data Right Arithmetic
66     0F     71         4     P4+                     PSRAW     xmm     imm8             sse2                         Shift Packed Data Right Arithmetic
    0F     71         6     PX+                     PSLLW     mm     imm8             mmx                         Shift Packed Data Left Logical
66     0F     71         6     P4+                     PSLLW     xmm     imm8             sse2                         Shift Packed Data Left Logical
    0F     72         2     PX+                     PSRLD     mm     imm8             mmx                         Shift Double Quadword Right Logical
66     0F     72         2     P4+                     PSRLD     xmm     imm8             sse2                         Shift Double Quadword Right Logical
    0F     72         4     PX+                     PSRAD     mm     imm8             mmx                         Shift Packed Data Right Arithmetic
66     0F     72         4     P4+                     PSRAD     xmm     imm8             sse2                         Shift Packed Data Right Arithmetic
    0F     72         6     PX+                     PSLLD     mm     imm8             mmx                         Shift Packed Data Left Logical
66     0F     72         6     P4+                     PSLLD     xmm     imm8             sse2                         Shift Packed Data Left Logical
    0F     73         2     PX+                     PSRLQ     mm     imm8             mmx                         Shift Packed Data Right Logical
66     0F     73         2     P4+                     PSRLQ     xmm     imm8             sse2                         Shift Packed Data Right Logical
66     0F     73         3     P4+                     PSRLDQ     xmm     imm8             sse2                         Shift Double Quadword Right Logical
    0F     73         6     PX+                     PSLLQ     mm     imm8             mmx                         Shift Packed Data Left Logical
66     0F     73         6     P4+                     PSLLQ     xmm     imm8             sse2                         Shift Packed Data Left Logical
66     0F     73         7     P4+                     PSLLDQ     xmm     imm8             sse2                         Shift Double Quadword Left Logical
    0F     74         r     PX+                     PCMPEQB     mm     mm/m64             mmx                         Compare Packed Data for Equal
66     0F     74         r     P4+                     PCMPEQB     xmm     xmm/m128             sse2                         Compare Packed Data for Equal
    0F     75         r     PX+                     PCMPEQW     mm     mm/m64             mmx                         Compare Packed Data for Equal
66     0F     75         r     P4+                     PCMPEQW     xmm     xmm/m128             sse2                         Compare Packed Data for Equal
    0F     76         r     PX+                     PCMPEQD     mm     mm/m64             mmx                         Compare Packed Data for Equal
66     0F     76         r     P4+                     PCMPEQD     xmm     xmm/m128             sse2                         Compare Packed Data for Equal
    0F     77             PX+                     EMMS                     mmx                         Empty MMX Technology State
    0F     78         r     P4++     D24     P     0         VMREAD     r/m32     r32             vmx         o..szapc     o..szapc             Read Field from Virtual-Machine Control Structure
    0F     79         r     P4++     D24     P     0         VMWRITE     r32     r/m32             vmx         o..szapc     o..szapc             Write Field to Virtual-Machine Control Structure
66     0F     7C         r     P4++                     HADDPD     xmm     xmm/m128             sse3                         Packed Double-FP Horizontal Add
F2     0F     7C         r     P4++                     HADDPS     xmm     xmm/m128             sse3                         Packed Single-FP Horizontal Add
66     0F     7D         r     P4++                     HSUBPD     xmm     xmm/m128             sse3                         Packed Double-FP Horizontal Subtract
F2     0F     7D         r     P4++                     HSUBPS     xmm     xmm/m128             sse3                         Packed Single-FP Horizontal Subtract
    0F     7E         r     PX+                     MOVD     r/m32     mm             mmx                         Move Doubleword
66     0F     7E         r     P4+                     MOVD     r/m32     xmm             sse2                         Move Doubleword
F3     0F     7E         r     P4+                     MOVQ     xmm     xmm/m64             sse2                         Move Quadword
    0F     7F         r     PX+                     MOVQ     mm/m64     mm             mmx                         Move Quadword
66     0F     7F         r     P4+                     MOVDQA     xmm/m128     xmm             sse2                         Move Aligned Double Quadword
F3     0F     7F         r     P4+                     MOVDQU     xmm/m128     xmm             sse2                         Move Unaligned Double Quadword
    0F     80             03+                     JO     rel16/32                     o.......                     Jump short if overflow (OF=1)
    0F     81             03+                     JNO     rel16/32                     o.......                     Jump short if not overflow (OF=0)
    0F     82             03+                     JB     rel16/32                     .......c                     Jump short if below/not above or equal/carry (CF=1)
JNAE     rel16/32
JC     rel16/32
    0F     83             03+                     JNB     rel16/32                     .......c                     Jump short if not below/above or equal/not carry (CF=0)
JAE     rel16/32
JNC     rel16/32
    0F     84             03+                     JZ     rel16/32                     ....z...                     Jump short if zero/equal (ZF=0)
JE     rel16/32
    0F     85             03+                     JNZ     rel16/32                     ....z...                     Jump short if not zero/not equal (ZF=1)
JNE     rel16/32
    0F     86             03+                     JBE     rel16/32                     ....z..c                     Jump short if below or equal/not above (CF=1 AND ZF=1)
JNA     rel16/32
    0F     87             03+                     JNBE     rel16/32                     ....z..c                     Jump short if not below or equal/above (CF=0 AND ZF=0)
JA     rel16/32
    0F     88             03+                     JS     rel16/32                     ...s....                     Jump short if sign (SF=1)
    0F     89             03+                     JNS     rel16/32                     ...s....                     Jump short if not sign (SF=0)
    0F     8A             03+                     JP     rel16/32                     ......p.                     Jump short if parity/parity even (PF=1)
JPE     rel16/32
    0F     8B             03+                     JNP     rel16/32                     ......p.                     Jump short if not parity/parity odd
JPO     rel16/32
    0F     8C             03+                     JL     rel16/32                     o..s....                     Jump short if less/not greater (SF!=OF)
JNGE     rel16/32
    0F     8D             03+                     JNL     rel16/32                     o..s....                     Jump short if not less/greater or equal (SF=OF)
JGE     rel16/32
    0F     8E             03+                     JLE     rel16/32                     o..sz...                     Jump short if less or equal/not greater ((ZF=1) OR (SF!=OF))
JNG     rel16/32
    0F     8F             03+                     JNLE     rel16/32                     o..sz...                     Jump short if not less nor equal/greater ((ZF=0) AND (SF=OF))
JG     rel16/32
    0F     90         0     03+     D18                 SETO     r/m8                     o.......                     Set Byte on Condition - overflow (OF=1)
    0F     91         0     03+     D18                 SETNO     r/m8                     o.......                     Set Byte on Condition - not overflow (OF=0)
    0F     92         0     03+     D18                 SETB     r/m8                     .......c                     Set Byte on Condition - below/not above or equal/carry (CF=1)
SETNAE     r/m8
SETC     r/m8
    0F     93         0     03+     D18                 SETNB     r/m8                     .......c                     Set Byte on Condition - not below/above or equal/not carry (CF=0)
SETAE     r/m8
SETNC     r/m8
    0F     94         0     03+     D18                 SETZ     r/m8                     ....z...                     Set Byte on Condition - zero/equal (ZF=0)
SETE     r/m8
    0F     95         0     03+     D18                 SETNZ     r/m8                     ....z...                     Set Byte on Condition - not zero/not equal (ZF=1)
SETNE     r/m8
    0F     96         0     03+     D18                 SETBE     r/m8                     ....z..c                     Set Byte on Condition - below or equal/not above (CF=1 AND ZF=1)
SETNA     r/m8
    0F     97         0     03+     D18                 SETNBE     r/m8                     ....z..c                     Set Byte on Condition - not below or equal/above (CF=0 AND ZF=0)
SETA     r/m8
    0F     98         0     03+     D18                 SETS     r/m8                     ...s....                     Set Byte on Condition - sign (SF=1)
    0F     99         0     03+     D18                 SETNS     r/m8                     ...s....                     Set Byte on Condition - not sign (SF=0)
    0F     9A         0     03+     D18                 SETP     r/m8                     ......p.                     Set Byte on Condition - parity/parity even (PF=1)
SETPE     r/m8
    0F     9B         0     03+     D18                 SETNP     r/m8                     ......p.                     Set Byte on Condition - not parity/parity odd
SETPO     r/m8
    0F     9C         0     03+     D18                 SETL     r/m8                     o..s....                     Set Byte on Condition - less/not greater (SF!=OF)
SETNGE     r/m8
    0F     9D         0     03+     D18                 SETNL     r/m8                     o..s....                     Set Byte on Condition - not less/greater or equal (SF=OF)
SETGE     r/m8
    0F     9E         0     03+     D18                 SETLE     r/m8                     o..sz...                     Set Byte on Condition - less or equal/not greater ((ZF=1) OR (SF!=OF))
SETNG     r/m8
    0F     9F         0     03+     D18                 SETNLE     r/m8                     o..sz...                     Set Byte on Condition - not less nor equal/greater ((ZF=0) AND (SF=OF))
SETG     r/m8
    0F     A0             03+                     PUSH     FS                                         Push Word, Doubleword or Quadword Onto the Stack
    0F     A1             03+                     POP     FS                                         Pop a Value from the Stack
    0F     A2             04++                     CPUID     IA32_BIOS_…     EAX     ECX     ...                             CPU Identification
    0F     A3         r     03+                     BT     r/m16/32     r16/32                     o..szapc     .......c     o..szap.         Bit Test
    0F     A4         r     03+                     SHLD     r/m16/32     r16/32     imm8                 o..szapc     o..sz.pc     o....a.c         Double Precision Shift Left
    0F     A5         r     03+                     SHLD     r/m16/32     r16/32     CL                 o..szapc     o..sz.pc     o....a.c         Double Precision Shift Left
    0F     A8             03+                     PUSH     GS                                         Push Word, Doubleword or Quadword Onto the Stack
    0F     A9             03+                     POP     GS                                         Pop a Value from the Stack
    0F     AA             03++         S             RSM     Flags                                         Resume from System Management Mode
    0F     AB         r     03+                 L     BTS     r/m16/32     r16/32                     o..szapc     .......c     o..szap.         Bit Test and Set
    0F     AC         r     03+                     SHRD     r/m16/32     r16/32     imm8                 o..szapc     o..sz.pc     o....a.c         Double Precision Shift Right
    0F     AD         r     03+                     SHRD     r/m16/32     r16/32     CL                 o..szapc     o..sz.pc     o....a.c         Double Precision Shift Right
    0F     AE         0     P2++                     FXSAVE     m512     ST     ST1     ...                             Save x87 FPU, MMX, XMM, and MXCSR State
    0F     AE         1     P2++                     FXRSTOR     ST     ST1     ST2     ...                             Restore x87 FPU, MMX, XMM, and MXCSR State
    0F     AE         2     P3+                     LDMXCSR     m32                 sse1                         Load MXCSR Register
    0F     AE         3     P3+                     STMXCSR     m32                 sse1                         Store MXCSR Register State
    0F     AE         4     C2++                     XSAVE     m     EDX     EAX     ...                             Save Processor Extended States
    0F     AE         5     P4+                     LFENCE                     sse2                         Load Fence
    0F     AE         5     C2++                     XRSTOR     ST     ST1     ST2     ...                             Restore Processor Extended States
    0F     AE         6     P4+                     MFENCE                     sse2                         Memory Fence
    0F     AE         7     P3+                     SFENCE                     sse1                         Store Fence
    0F     AE         7     P4+                     CLFLUSH     m8                 sse2                         Flush Cache Line
    0F     AF         r     03+                     IMUL     r16/32     r/m16/32                     o..szapc     o......c     ...szap.         Signed Multiply
    0F     B0         r     04+     D19             L     CMPXCHG     r/m8     AL     r8                 o..szapc     o..szapc             Compare and Exchange
    0F     B1         r     04+     D19             L     CMPXCHG     r/m16/32     eAX     r16/32                 o..szapc     o..szapc             Compare and Exchange
    0F     B2         r     03+                     LSS     SS     r16/32     m16:16/32                                 Load Far Pointer
    0F     B3         r     03+                 L     BTR     r/m16/32     r16/32                     o..szapc     .......c     o..szap.         Bit Test and Reset
    0F     B4         r     03+                     LFS     FS     r16/32     m16:16/32                                 Load Far Pointer
    0F     B5         r     03+                     LGS     GS     r16/32     m16:16/32                                 Load Far Pointer
    0F     B6         r     03+                     MOVZX     r16/32     r/m8                                     Move with Zero-Extend
    0F     B7         r     03+                     MOVZX     r16/32     r/m16                                     Move with Zero-Extend
F3     0F     B8         r     C2++                     POPCNT     r16/32     r/m16/32                     o..szapc             o..s.apc     Bit Population Count
    0F     B9         r     02+     M20                 UD     r     r/m                                     Undefined Instruction
    0F     BA         4     03+                     BT     r/m16/32     imm8                     o..szapc     .......c     o..szap.         Bit Test
    0F     BA         5     03+                 L     BTS     r/m16/32     imm8                     o..szapc     .......c     o..szap.         Bit Test and Set
    0F     BA         6     03+                 L     BTR     r/m16/32     imm8                     o..szapc     .......c     o..szap.         Bit Test and Reset
    0F     BA         7     03+                 L     BTC     r/m16/32     imm8                     o..szapc     .......c     o..szap.         Bit Test and Complement
    0F     BB         r     03+                 L     BTC     r/m16/32     r16/32                     o..szapc     .......c     o..szap.         Bit Test and Complement
    0F     BC         r     03+                     BSF     r16/32     r/m16/32                     o..szapc     ....z...     o..s.apc         Bit Scan Forward
    0F     BD         r     03+                     BSR     r16/32     r/m16/32                     o..szapc     ....z...     o..s.apc         Bit Scan Reverse
    0F     BE         r     03+                     MOVSX     r16/32     r/m8                                     Move with Sign-Extension
    0F     BF         r     03+                     MOVSX     r16/32     r/m16                                     Move with Sign-Extension
    0F     C0         r     04+                 L     XADD     r/m8     r8                     o..szapc     o..szapc             Exchange and Add
    0F     C1         r     04+                 L     XADD     r/m16/32     r16/32                     o..szapc     o..szapc             Exchange and Add
    0F     C2         r     P3+                     CMPPS     xmm     xmm/m128     imm8         sse1                         Compare Packed Single-FP Values
F3     0F     C2         r     P3+                     CMPSS     xmm     xmm/m32     imm8         sse1                         Compare Scalar Single-FP Values
66     0F     C2         r     P4+                     CMPPD     xmm     xmm/m128     imm8         sse2                         Compare Packed Double-FP Values
F2     0F     C2         r     P4+                     CMPSD     xmm     xmm/m64     imm8         sse2                         Compare Scalar Double-FP Values
    0F     C3         r     P4+                     MOVNTI     m32     r32             sse2                         Store Doubleword Using Non-Temporal Hint
    0F     C4         r     P3+                     PINSRW     mm     r32     imm8         sse1                         Insert Word
PINSRW     mm     m16     imm8
66     0F     C4         r     P3+                     PINSRW     xmm     r32     imm8         sse1                         Insert Word
PINSRW     xmm     m16     imm8
    0F     C5         r     P3+                     PEXTRW     r32     mm     imm8         sse1                         Extract Word
66     0F     C5         r     P3+                     PEXTRW     r32     xmm     imm8         sse1                         Extract Word
    0F     C6         r     P3+                     SHUFPS     xmm     xmm/m128     imm8         sse1                         Shuffle Packed Single-FP Values
66     0F     C6         r     P4+                     SHUFPD     xmm     xmm/m128     imm8         sse2                         Shuffle Packed Double-FP Values
    0F     C7         1     P1+     D21             L     CMPXCHG8B     m64     EAX     EDX     ...             ....z...     ....z...             Compare and Exchange Bytes
    0F     C7         6     P4++     D24     P     0         VMPTRLD     m64                 vmx         o..szapc     o..szapc             Load Pointer to Virtual-Machine Control Structure
66     0F     C7         6     P4++     D24     P     0         VMCLEAR     m64                 vmx         o..szapc     o..szapc             Clear Virtual-Machine Control Structure
F3     0F     C7         6     P4++     D24     P     0         VMXON     m64                 vmx         o..szapc     o..szapc             Enter VMX Operation
    0F     C7         7     P4++     D24     P     0         VMPTRST     m64                 vmx         o..szapc     o..szapc             Store Pointer to Virtual-Machine Control Structure
    0F     C8+r         04+     D22                 BSWAP     r16/32                                         Byte Swap
66     0F     D0         r     P4++                     ADDSUBPD     xmm     xmm/m128             sse3                         Packed Double-FP Add/Subtract
F2     0F     D0         r     P4++                     ADDSUBPS     xmm     xmm/m128             sse3                         Packed Single-FP Add/Subtract
    0F     D1         r     PX+                     PSRLW     mm     mm/m64             mmx                         Shift Packed Data Right Logical
66     0F     D1         r     P4+                     PSRLW     xmm     xmm/m128             sse2                         Shift Packed Data Right Logical
    0F     D2         r     PX+                     PSRLD     mm     mm/m64             mmx                         Shift Packed Data Right Logical
66     0F     D2         r     P4+                     PSRLD     xmm     xmm/m128             sse2                         Shift Packed Data Right Logical
    0F     D3         r     PX+                     PSRLQ     mm     mm/m64             mmx                         Shift Packed Data Right Logical
66     0F     D3         r     P4+                     PSRLQ     xmm     xmm/m128             sse2                         Shift Packed Data Right Logical
    0F     D4         r     PX+                     PADDQ     mm     mm/m64             sse2                         Add Packed Quadword Integers
66     0F     D4         r     P4+                     PADDQ     xmm     xmm/m128             sse2                         Add Packed Quadword Integers
    0F     D5         r     PX+                     PMULLW     mm     mm/m64             mmx                         Multiply Packed Signed Integers and Store Low Result
66     0F     D5         r     P4+                     PMULLW     xmm     xmm/m128             sse2                         Multiply Packed Signed Integers and Store Low Result
66     0F     D6         r     P4+                     MOVQ     xmm/m64     xmm             sse2                         Move Quadword
F3     0F     D6         r     P4+                     MOVQ2DQ     xmm     mm             sse2                         Move Quadword from MMX Technology to XMM Register
F2     0F     D6         r     P4+                     MOVDQ2Q     mm     xmm             sse2                         Move Quadword from XMM to MMX Technology Register
    0F     D7         r     P3+                     PMOVMSKB     r32     mm             sse1                         Move Byte Mask
66     0F     D7         r     P3+                     PMOVMSKB     r32     xmm             sse1                         Move Byte Mask
    0F     D8         r     PX+                     PSUBUSB     mm     mm/m64             mmx                         Subtract Packed Unsigned Integers with Unsigned Saturation
66     0F     D8         r     P4+                     PSUBUSB     xmm     xmm/m128             sse2                         Subtract Packed Unsigned Integers with Unsigned Saturation
    0F     D9         r     PX+                     PSUBUSW     mm     mm/m64             mmx                         Subtract Packed Unsigned Integers with Unsigned Saturation
66     0F     D9         r     PX+                     PSUBUSW     xmm     xmm/m128             sse2                         Subtract Packed Unsigned Integers with Unsigned Saturation
    0F     DA         r     P3+                     PMINUB     mm     mm/m64             sse1                         Minimum of Packed Unsigned Byte Integers
66     0F     DA         r     P3+                     PMINUB     xmm     xmm/m128             sse1                         Minimum of Packed Unsigned Byte Integers
    0F     DB         r     PX+                     PAND     mm     mm/m64             mmx                         Logical AND
66     0F     DB         r     P4+                     PAND     xmm     xmm/m128             sse2                         Logical AND
    0F     DC         r     PX+                     PADDUSB     mm     mm/m64             mmx                         Add Packed Unsigned Integers with Unsigned Saturation
66     0F     DC         r     P4+                     PADDUSB     xmm     xmm/m128             sse2                         Add Packed Unsigned Integers with Unsigned Saturation
    0F     DD         r     PX+                     PADDUSW     mm     mm/m64             mmx                         Add Packed Unsigned Integers with Unsigned Saturation
66     0F     DD         r     P4+                     PADDUSW     xmm     xmm/m128             sse2                         Add Packed Unsigned Integers with Unsigned Saturation
    0F     DE         r     P3+                     PMAXUB     mm     mm/m64             sse1                         Maximum of Packed Unsigned Byte Integers
66     0F     DE         r     P3+                     PMAXUB     xmm     xmm/m128             sse1                         Maximum of Packed Unsigned Byte Integers
    0F     DF         r     PX+                     PANDN     mm     mm/m64             mmx                         Logical AND NOT
66     0F     DF         r     P4+                     PANDN     xmm     xmm/m128             sse2                         Logical AND NOT
    0F     E0         r     P3+                     PAVGB     mm     mm/m64             sse1                         Average Packed Integers
66     0F     E0         r     P3+                     PAVGB     xmm     xmm/m128             sse1                         Average Packed Integers
    0F     E1         r     PX+                     PSRAW     mm     mm/m64             mmx                         Shift Packed Data Right Arithmetic
66     0F     E1         r     P4+                     PSRAW     xmm     xmm/m128             sse2                         Shift Packed Data Right Arithmetic
    0F     E2         r     PX+                     PSRAD     mm     mm/m64             mmx                         Shift Packed Data Right Arithmetic
66     0F     E2         r     P4+                     PSRAD     xmm     xmm/m128             sse2                         Shift Packed Data Right Arithmetic
    0F     E3         r     P3+                     PAVGW     mm     mm/m64             sse1                         Average Packed Integers
66     0F     E3         r     P3+                     PAVGW     xmm     xmm/m128             sse1                         Average Packed Integers
    0F     E4         r     P3+                     PMULHUW     mm     mm/m64             sse1                         Multiply Packed Unsigned Integers and Store High Result
66     0F     E4         r     P3+                     PMULHUW     xmm     xmm/m128             sse1                         Multiply Packed Unsigned Integers and Store High Result
    0F     E5         r     PX+                     PMULHW     mm     mm/m64             mmx                         Multiply Packed Signed Integers and Store High Result
66     0F     E5         r     P4+                     PMULHW     xmm     xmm/m128             sse2                         Multiply Packed Signed Integers and Store High Result
F2     0F     E6         r     P4+                     CVTPD2DQ     xmm     xmm/m128             sse2                         Convert Packed Double-FP Values to DW Integers
66     0F     E6         r     P4+                     CVTTPD2DQ     xmm     xmm/m128             sse2                         Convert with Trunc. Packed Double-FP Values to DW Integers
F3     0F     E6         r     P4+                     CVTDQ2PD     xmm     xmm/m128             sse2                         Convert Packed DW Integers to Double-FP Values
    0F     E7         r     P3+                     MOVNTQ     m64     mm             sse1                         Store of Quadword Using Non-Temporal Hint
66     0F     E7         r     P4+                     MOVNTDQ     m128     xmm             sse2                         Store Double Quadword Using Non-Temporal Hint
    0F     E8         r     PX+                     PSUBSB     mm     mm/m64             mmx                         Subtract Packed Signed Integers with Signed Saturation
66     0F     E8         r     P4+                     PSUBSB     xmm     xmm/m128             sse2                         Subtract Packed Signed Integers with Signed Saturation
    0F     E9         r     PX+                     PSUBSW     mm     mm/m64             mmx                         Subtract Packed Signed Integers with Signed Saturation
66     0F     E9         r     P4+                     PSUBSW     xmm     xmm/m128             sse2                         Subtract Packed Signed Integers with Signed Saturation
    0F     EA         r     P3+                     PMINSW     mm     mm/m64             sse1                         Minimum of Packed Signed Word Integers
66     0F     EA         r     P3+                     PMINSW     xmm     xmm/m128             sse1                         Minimum of Packed Signed Word Integers
    0F     EB         r     PX+                     POR     mm     mm/m64             mmx                         Bitwise Logical OR
66     0F     EB         r     P4+                     POR     xmm     xmm/m128             sse2                         Bitwise Logical OR
    0F     EC         r     PX+                     PADDSB     mm     mm/m64             mmx                         Add Packed Signed Integers with Signed Saturation
66     0F     EC         r     P4+                     PADDSB     xmm     xmm/m128             sse2                         Add Packed Signed Integers with Signed Saturation
    0F     ED         r     PX+                     PADDSW     mm     mm/m64             mmx                         Add Packed Signed Integers with Signed Saturation
66     0F     ED         r     P4+                     PADDSW     xmm     xmm/m128             sse2                         Add Packed Signed Integers with Signed Saturation
    0F     EE         r     P3+                     PMAXSW     mm     mm/m64             sse1                         Maximum of Packed Signed Word Integers
66     0F     EE         r     P3+                     PMAXSW     xmm     xmm/m128             sse1                         Maximum of Packed Signed Word Integers
    0F     EF         r     PX+                     PXOR     mm     mm/m64             mmx                         Logical Exclusive OR
66     0F     EF         r     P4+                     PXOR     xmm     xmm/m128             sse2                         Logical Exclusive OR
F2     0F     F0         r     P4++                     LDDQU     xmm     m128             sse3                         Load Unaligned Integer 128 Bits
    0F     F1         r     PX+                     PSLLW     mm     mm/m64             mmx                         Shift Packed Data Left Logical
66     0F     F1         r     P4+                     PSLLW     xmm     xmm/m128             sse2                         Shift Packed Data Left Logical
    0F     F2         r     PX+                     PSLLD     mm     mm/m64             mmx                         Shift Packed Data Left Logical
66     0F     F2         r     P4+                     PSLLD     xmm     xmm/m128             sse2                         Shift Packed Data Left Logical
    0F     F3         r     PX+                     PSLLQ     mm     mm/m64             mmx                         Shift Packed Data Left Logical
66     0F     F3         r     P4+                     PSLLQ     xmm     xmm/m128             sse2                         Shift Packed Data Left Logical
    0F     F4         r     P4+                     PMULUDQ     mm     mm/m64             sse2                         Multiply Packed Unsigned DW Integers
66     0F     F4         r     P4+                     PMULUDQ     xmm     xmm/m128             sse2                         Multiply Packed Unsigned DW Integers
    0F     F5         r     PX+                     PMADDWD     mm     mm/m64             mmx                         Multiply and Add Packed Integers
66     0F     F5         r     P4+                     PMADDWD     xmm     xmm/m128             sse2                         Multiply and Add Packed Integers
    0F     F6         r     P3+                     PSADBW     mm     mm/m64             sse1                         Compute Sum of Absolute Differences
66     0F     F6         r     P3+                     PSADBW     xmm     xmm/m128             sse1                         Compute Sum of Absolute Differences
    0F     F7         r     P3+     D23                 MASKMOVQ     m64     mm     mm         sse1                         Store Selected Bytes of Quadword
66     0F     F7         r     P4+                     MASKMOVDQU     m128     xmm     xmm         sse2                         Store Selected Bytes of Double Quadword
    0F     F8         r     PX+                     PSUBB     mm     mm/m64             mmx                         Subtract Packed Integers
66     0F     F8         r     P4+                     PSUBB     xmm     xmm/m128             sse2                         Subtract Packed Integers
    0F     F9         r     PX+                     PSUBW     mm     mm/m64             mmx                         Subtract Packed Integers
66     0F     F9         r     P4+                     PSUBW     xmm     xmm/m128             sse2                         Subtract Packed Integers
    0F     FA         r     PX+                     PSUBD     mm     mm/m64             mmx                         Subtract Packed Integers
66     0F     FA         r     P4+                     PSUBD     xmm     xmm/m128             sse2                         Subtract Packed Integers
    0F     FB         r     P4+                     PSUBQ     mm     mm/m64             sse2                         Subtract Packed Quadword Integers
66     0F     FB         r     P4+                     PSUBQ     xmm     xmm/m128             sse2                         Subtract Packed Quadword Integers
    0F     FC         r     PX+                     PADDB     mm     mm/m64             mmx                         Add Packed Integers
66     0F     FC         r     P4+                     PADDB     xmm     xmm/m128             sse2                         Add Packed Integers
    0F     FD         r     PX+                     PADDW     mm     mm/m64             mmx                         Add Packed Integers
66     0F     FD         r     P4+                     PADDW     xmm     xmm/m128             sse2                         Add Packed Integers
    0F     FE         r     PX+                     PADDD     mm     mm/m64             mmx                         Add Packed Integers
66     0F     FE         r     P4+                     PADDD     xmm     xmm/m128             sse2                         Add Packed Integers
````

-->

(...)

**Mnemonic collision**

movsd refers to two opcodes:
- ````A5````: "Move Data from String to String"
- ````F2````: "Move Scalar Double-precision floating-point" 

---

## Compilation & test

- Install [NASM](http://www.nasm.us/) and [DosBox](http://www.dosbox.com/).
- Compile .asm file in .COM with ````nasm xxx.asm -fbin -o xxx.com````
- Disassemble a .COM file with ````ndisasm -o100h xxx.com````
- View a .COM file size with ````dir xxx.com````
- Test a .COM file by running it wirh DosBox (drag & drop the file on the DosBox shortcut, adjust speed with ctrl+F11 & ctrl+F12)

---

## Disassembly

**Algorithm:**

- Check if the current byte is an instruction prefix byte (F3, F2, or F0). if so, you've got a REP/REPE/REPNE/LOCK prefix. Advance to the next byte.
- Check to see if the current byte is an address size byte (67). If so, decode addresses in the rest of the instruction in 16-bit mode if currently in 32-bit mode, or in 32-bit mode if currently in 16-bit mode.
- Check to see if the current byte is an operand size byte (66). If so, decode immediate operands in 16-bit mode if currently in 32-bit mode, or in 32-bit mode if currently in 16-bit mode.
- Check to see if the current byte is a segment override byte (2E, 36, 3E, 26, 64, or 65). If so, use the corresponding segment register for decoding addresses instead of the default segment register.
- The next byte is the opcode. If the opcode is 0F, then it is an extended opcode, and read the next byte as the extended opcode.
- Depending on the particular opcode, read in and decode a Mod R/M byte, a Scale Index Base (SIB) byte, a displacement (0, 1, 2, or 4 bytes), and/or an immediate value (0, 1, 2, or 4 bytes). The sizes of these fields depend on the opcode , address size override, and operand size overrides previously decoded.

(for x86, steps 1 to 4 can be in any order and repeated. For x86-64 and modern instruction sets like AVX / AVX2, it's strictly in this order)

**Notes:**
- When it encounters data bytes in the .COM file, the disassembler can try to interpret them as instructions. To avoid that, the disassembler can try to determine (like an emulator) which addresses the instruction pointer can really reach via normal execution, jumps or interrupts. Else, some sort of manual separation of code and data would be necessary to be totally accurate.
- The bytes that don't belong to any instruction can be disassembled as ````db```` statements. Their type (number, string, ...) depends on the instructions using them, so it would be wise to provide numeric and string values for each byte of data.
- In .COM demos, data bytes are generally placed at the end of the program. The beginning is used by instructions stored sequentially and end with ````ret````. (lazy devs may rely only on that to stop reading instructions)

---

## Emulation

A x86 emulator needs to reproduce the behavior of all (nested) registers, flags, memory, disassemble and execute every instruction, and handle input (mouse, keyboard), output (screen, sound) and interrupts.
<br>
The current project (minix86) is an example of how to do so in JavaScript.

### Interrupts

Software iterrupts are triggered by the ````INT x```` instruction. According to the value of x (between 0h and FFh), a predefined program is executed.
<br>
If x equals ````0x20```` to ````0x2F````, a MS-DOS API call is performed. The value of ````AH```` indicated the subprogram to run.
<br>
The most important interrupts are:

- ````INT 10h && AH = 00h````: Set video mode according to the value of ````AL````. (generally ````13h````)
- ````INT 16h && AH = 1````: Read keystroke (AL is set to the value of the ASCII char)
- ````INT 21h && AH = 09h````: Display a string ($-terminated string, address stored in DX)


### Video output

**Textmode (default, Mode 3)**

- 80x25 chars
- Chars are drawn in 8*16px boxes.
- Screen resolution: 640*400px
- 16 colors ([palette](https://en.wikipedia.org/wiki/List_of_8-bit_computer_hardware_palettes#CGA))
- 2 bytes per char (8 bits for char, 4 bits for text color, 4 bits for background color)
- Starts at address video memory starts at 0xB800:0000
- Charset: [Code Page 437](https://www.ascii-codes.com/charsets/cp437.png). (256 characters)

NB: char size, resolution and color palette vary with the hardware used. These seem to be the most common ones.

Example:

````
org 100h			    ; we start at CS:100h
xchg 	bp,ax		    ; put 09h into AH
mov		dx,text		    ; DX expects the adress of a $ terminated string
int 	21h			    ; call the DOS function (AH = 09h)
ret					    ; quit
text: db 'Hello World!$'
````

[This page](http://www.sizecoding.org/wiki/Output#Low_level_access) shows how to output text via low-level access:


**Mode 13h**

- 320x200
- 256 colors ([Default palette](https://en.wikipedia.org/wiki/Video_Graphics_Array#/media/File:VGA_palette_with_black_borders.svg))
- The palette can be modified with code
- 1 byte per pixel (color)
- Starts at address A000:0000

Example:

Init:

````
mov al,0x13
int 0x10
````

Set ES to A000:0000 (or another segent register):

````
push 0xa000
pop es
````

Draw a pixel on screen:

- Write on ES with ````stosb````.
- Write on DS with ````mov````.
- Write on SS with ````push````.


**Other video modes**

[Many exist](http://www.columbia.edu/~em36/wpdos/videomodes.txt) but very few are used in demoscene, besides text and 13h.


### Keyboard input

**ESC key:**

````
in      al,60h          ;read whatever is at keyboard port; looking for ESC which is #1
dec     ax              ;if ESC, AX now 0
jnz     mainloop        ;fall through if 0, do jump somewhere else if otherwise
````

**Any key:**

The most reliable way is to use an interrupt (````INT 16h / AH=1````):

````
mov ah,1           ; subfunction AH = 1, check for key
int 16h
jz  mainloop       ; ZF set if no keystroke available
````

[More info](http://www.sizecoding.org/wiki/Input#Checking_for_any_keypress)

### Mouse input

- Show mouse cursor with: ````INT 33h / AX=0001h````
- Get position and button status with ````INT 33h / AX=0003h```` (CX = row, DX = column, BX bits 0/1/2 = left/center/right button down)
- etc...

([More info](http://www.ctyme.com/intr/int-33.htm))


### Sound output

MIDI audio output can be produced by writing on the MIDI control port (0x331) and MIDI data port (0x330).

([more info](http://www.sizecoding.org/wiki/Output#Producing_sound))

---

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
- [CP437](https://www.ascii-codes.com/)
- [MS-DOS API](https://en.wikipedia.org/wiki/MS-DOS_API)
- [Interrupts](http://www.ctyme.com/intr/int.htm)
- [x86 decompiler & emulator in JS, coming soon in this repo](https://xem.github.io/minix86)
