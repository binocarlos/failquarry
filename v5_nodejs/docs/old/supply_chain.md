#Supply Chain
These are the methods by which we transport packets from warehouse to warehouse to supplier etc

There are different characters of supply chain as well as different transports.

A character describes the high level protocol for how we will communicate.

All supply chain Characters come in pairs - an error will throw if you try to connect one end to a different
pairing on the other end

	PUSH/PULL

		PUSH = fn(packet)

		PULL = fn(packet)

	REQ/REP

		REQ = fn(packet, callback)

		REP = fn(packet, callback)

	PUB/SUB

		PUB = fn(packet)

		SUB = fn(packet)
