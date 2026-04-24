const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("WDWC Upgradeable", function () {
  let wdwc;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const WDWC = await ethers.getContractFactory("WDWC");
    wdwc = await upgrades.deployProxy(WDWC, [owner.address], {
      initializer: "initialize",
      kind: "uups"
    });
    await wdwc.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await wdwc.name()).to.equal("Wrapped DarkWave Coin");
      expect(await wdwc.symbol()).to.equal("wDWC");
    });

    it("Should set the bridge operator as owner", async function () {
      expect(await wdwc.owner()).to.equal(owner.address);
    });

    it("Should have 18 decimals", async function () {
      expect(await wdwc.decimals()).to.equal(18);
    });

    it("Should start with zero total supply", async function () {
      expect(await wdwc.totalSupply()).to.equal(0);
    });

    it("Should report version 1", async function () {
      expect(await wdwc.getVersion()).to.equal(1);
    });
  });

  describe("Minting", function () {
    const lockId = ethers.keccak256(ethers.toUtf8Bytes("lock1"));
    const amount = ethers.parseEther("100");

    it("Should allow bridge operator to mint", async function () {
      await wdwc.mint(user1.address, amount, lockId);
      expect(await wdwc.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should emit BridgeMint event", async function () {
      await expect(wdwc.mint(user1.address, amount, lockId))
        .to.emit(wdwc, "BridgeMint")
        .withArgs(user1.address, amount, lockId);
    });

    it("Should mark lock ID as processed", async function () {
      await wdwc.mint(user1.address, amount, lockId);
      expect(await wdwc.isLockProcessed(lockId)).to.equal(true);
    });

    it("Should reject duplicate lock ID", async function () {
      await wdwc.mint(user1.address, amount, lockId);
      await expect(wdwc.mint(user1.address, amount, lockId))
        .to.be.revertedWith("Lock already processed");
    });

    it("Should reject minting from non-owner", async function () {
      await expect(wdwc.connect(user1).mint(user1.address, amount, lockId))
        .to.be.revertedWithCustomError(wdwc, "OwnableUnauthorizedAccount");
    });
  });

  describe("Bridge Burning", function () {
    const lockId = ethers.keccak256(ethers.toUtf8Bytes("lock1"));
    const amount = ethers.parseEther("100");
    const dscAddress = "DSC1abc123def456";

    beforeEach(async function () {
      await wdwc.mint(user1.address, amount, lockId);
    });

    it("Should allow users to burn for bridge", async function () {
      const burnAmount = ethers.parseEther("50");
      await wdwc.connect(user1).bridgeBurn(burnAmount, dscAddress);
      expect(await wdwc.balanceOf(user1.address)).to.equal(amount - burnAmount);
    });

    it("Should emit BridgeBurn event", async function () {
      const burnAmount = ethers.parseEther("50");
      await expect(wdwc.connect(user1).bridgeBurn(burnAmount, dscAddress))
        .to.emit(wdwc, "BridgeBurn")
        .withArgs(user1.address, burnAmount, dscAddress);
    });

    it("Should reject empty DSC address", async function () {
      const burnAmount = ethers.parseEther("50");
      await expect(wdwc.connect(user1).bridgeBurn(burnAmount, ""))
        .to.be.revertedWith("Invalid DSC address");
    });

    it("Should reject burning more than balance", async function () {
      const burnAmount = ethers.parseEther("200");
      await expect(wdwc.connect(user1).bridgeBurn(burnAmount, dscAddress))
        .to.be.revertedWithCustomError(wdwc, "ERC20InsufficientBalance");
    });
  });

  describe("Bridge Operator Transfer", function () {
    it("Should allow owner to transfer operator role", async function () {
      await wdwc.transferBridgeOperator(user1.address);
      expect(await wdwc.owner()).to.equal(user1.address);
    });

    it("Should reject transfer from non-owner", async function () {
      await expect(wdwc.connect(user1).transferBridgeOperator(user2.address))
        .to.be.revertedWithCustomError(wdwc, "OwnableUnauthorizedAccount");
    });
  });

  describe("Upgradeability", function () {
    it("Should be upgradeable by owner", async function () {
      const WDWCV2 = await ethers.getContractFactory("WDWC");
      const upgraded = await upgrades.upgradeProxy(await wdwc.getAddress(), WDWCV2, {
        kind: "uups"
      });
      expect(await upgraded.getVersion()).to.equal(1);
    });

    it("Should reject upgrade from non-owner", async function () {
      const WDWCV2 = await ethers.getContractFactory("WDWC", user1);
      await expect(
        upgrades.upgradeProxy(await wdwc.getAddress(), WDWCV2, { kind: "uups" })
      ).to.be.reverted;
    });

    it("Should preserve state after upgrade", async function () {
      const lockId = ethers.keccak256(ethers.toUtf8Bytes("lock1"));
      const amount = ethers.parseEther("100");
      await wdwc.mint(user1.address, amount, lockId);

      const WDWCV2 = await ethers.getContractFactory("WDWC");
      const upgraded = await upgrades.upgradeProxy(await wdwc.getAddress(), WDWCV2, {
        kind: "uups"
      });

      expect(await upgraded.balanceOf(user1.address)).to.equal(amount);
      expect(await upgraded.isLockProcessed(lockId)).to.equal(true);
    });
  });

  describe("Emergency Pause", function () {
    const lockId = ethers.keccak256(ethers.toUtf8Bytes("lock1"));
    const amount = ethers.parseEther("100");
    const dscAddress = "DSC1abc123def456";

    it("Should start unpaused", async function () {
      expect(await wdwc.isPaused()).to.equal(false);
    });

    it("Should allow owner to pause", async function () {
      await wdwc.pause();
      expect(await wdwc.isPaused()).to.equal(true);
    });

    it("Should allow owner to unpause", async function () {
      await wdwc.pause();
      await wdwc.unpause();
      expect(await wdwc.isPaused()).to.equal(false);
    });

    it("Should reject pause from non-owner", async function () {
      await expect(wdwc.connect(user1).pause())
        .to.be.revertedWithCustomError(wdwc, "OwnableUnauthorizedAccount");
    });

    it("Should block minting when paused", async function () {
      await wdwc.pause();
      await expect(wdwc.mint(user1.address, amount, lockId))
        .to.be.revertedWithCustomError(wdwc, "EnforcedPause");
    });

    it("Should block bridge burning when paused", async function () {
      await wdwc.mint(user1.address, amount, lockId);
      await wdwc.pause();
      await expect(wdwc.connect(user1).bridgeBurn(amount, dscAddress))
        .to.be.revertedWithCustomError(wdwc, "EnforcedPause");
    });

    it("Should allow minting after unpause", async function () {
      await wdwc.pause();
      await wdwc.unpause();
      await wdwc.mint(user1.address, amount, lockId);
      expect(await wdwc.balanceOf(user1.address)).to.equal(amount);
    });
  });
});
