import dedent from "dedent"

export const grids = dedent`
_____
_____
_____
_____
_____


#___#
_____
_____
_____
#___#


#___#
#___#
_____
_____
_____


_____
_____
_____
#___#
#___#


#____
#____
_____
____#
____#


##___
#____
_____
____#
___##


___##
____#
_____
#____
##___


#____
_____
_____
_____
____#


____#
_____
_____
_____
#____


##___
#____
_____
_____
____#


#____
_____
_____
____#
___##
`
  .split("\n\n")
  .map((grid) => grid.trim())
