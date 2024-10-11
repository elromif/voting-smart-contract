import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NAMES = ["Bob", "Alice"];

const ADDRESSES = ["0x98cC8F6627688A48D2A4cc17Cd79741cC67c9DdA", "0x0D476789a3B7C3D19cA3E02394a934bb84fC31D3"];

const VotingModule = buildModule("VotingModule", (m) => {

  const candidates = m.getParameter("_candidate_names", NAMES);

  const addresses = m.getParameter("_candidate_addresses", ADDRESSES);

  const voting = m.contract("Voting", [candidates, addresses]);

  return { voting };
});

export default VotingModule;
