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
By means of the following component, we can simply generate a random phishing prevention canva, that will be rendered on its parent component
in a deterministic way depending on the provided uuid.

```tsx
<PhishingPrevention
    uuid={"38cb4f4d-050c-4022-a315-4b5218e53800"}
    size={300}
/>
```

Also, a base64 string of the generated image can be obtained by calling the following function:

```ts
const base64ImageString = await generatePhishingPrevention("38cb4f4d-050c-4022-a315-4b5218e53800", 300)
```

## Props

| Prop                                                           | Required           | Type     | Description                                                                                                                                                                                                           |
| -------------------------------------------------------------- | :------------------: | :--------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| uuid                                                           | :heavy_check_mark: | String   | A randomly generated uuid to use as seed for randomness and noise  
| size                                                           | :x:                | Number   | The size of the canvas (defaults to the window size)