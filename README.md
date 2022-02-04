<div align="center">
  <h1>Phishing Prevention</h1>
  <p>This library allows rendering a Phishing prevention image into the wallet.</p>
</div>


## Installation

-   npm

    ```bash
    npm i --save https://github.com/block-wallet/phishing-prevention
    ```

-   yarn

    ```bash
    yarn add https://github.com/block-wallet/phishing-prevention
    ```

## Usage
Simply by calling the following function, we can generate a deterministically generated phishing prevention image in base64 format
based on the provided uuid. This will allow us in the feature to let the user decide which phishing image to use based on the UUID seed.

```ts
const base64ImageString = await generatePhishingPrevention("38cb4f4d-050c-4022-a315-4b5218e53800", 300)
```

## Props

| Prop                                                           | Required           | Type     | Description                                                                                                                                                                                                           |
| -------------------------------------------------------------- | :------------------: | :--------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| uuid                                                           | :heavy_check_mark: | String   | A randomly generated uuid to use as seed for randomness and noise  
| size                                                           | :heavy_check_mark: | Number   | The size of the canvas