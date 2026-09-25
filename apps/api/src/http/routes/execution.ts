    try {
      const body = request.body as ExecutionRequest;

      // Server-side builder injection — frontend must never provide builder config
      const userWallet = "0x0000000000000000000000000000000000000000"; // from auth session
      const serverBuilder = createBuilderCodeConfig(
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        10,
      );
      serverBuilder.approvedAt = Date.now(); // simulated server-side approval

      const normalized = normalizeOrderIntent({
        account: {
          telegramUserId: 0,
          walletAddress: userWallet,
        },
        coin: body.coin,
        side: body.side,
        type: body.type,
        size: body.size,
        ...(body.limitPrice !== undefined && {
          limitPrice: body.limitPrice,
        }),
      });

      const intent: ExecutionIntent = createExecutionIntent({
        order: normalized,
        builder: serverBuilder,
      });
